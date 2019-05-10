import requestPromise from "request-promise";
import httpStatus from "http-status";
import { isEmpty, chunk, uniqBy, difference } from "lodash";
import config from "../../config/config";

import logger from "../../config/Log";
import * as sparQLService from "../../services/sparql.service";
import blockchainService from "../../services/blockchain.service";

import { STATUSES } from "../../utils/constants";

const handleNotify = async (resources, unique = false) => {
  const x = Math.ceil(resources.length / 5);
  const publishChunks = chunk(resources, x);

  const promises = publishChunks.map(resourceChunk =>
    blockchainService.notify(resourceChunk)
  );

  if (unique) {
    await Promise.all(promises);
  }
};

// has no dependencies - only internal logging needed
const notify = async (req, res, next) => {
  try {
    logger.info("Notified - querying resources...");

    const result = await sparQLService.queryAllResourcesByStatus(
      STATUSES.UNPUBLISHED
    );

    // Remove multiple actions on the same object - keep these for the next iteration
    const resources = uniqBy(result, ({ resourceUri }) => resourceUri.value);

    // Unique resources - awaiting action to register
    const uniqueResources = uniqBy(
      resources,
      ({ signatory }) => signatory.value
    );

    // All non-unique resources, which can be handled async
    const nonUniqueResources = difference(resources, uniqueResources);

    await blockchainService.setToPublishing(uniqueResources);
    await blockchainService.setToPublishing(nonUniqueResources);

    logger.info(
      `${uniqueResources.length +
        nonUniqueResources.length} resources ready to be published/signed/burned`
    );

    // console.log("result", result.length);
    // console.log("resources", resources.length);
    // console.log("uniqueResources", uniqueResources.length);
    // console.log("non-unique ", nonUniqueResources.length);

    if (!isEmpty(uniqueResources)) {
      await handleNotify(uniqueResources, true);
    }

    if (!isEmpty(nonUniqueResources)) {
      handleNotify(nonUniqueResources);
    }

    res.sendStatus(httpStatus.OK);
  } catch (e) {
    logger.error(`Error during notify ${e}`);
    next(e);
  }
};

const validate = async (req, res, next) => {
  try {
    const {
      results: { bindings: publishedResources }
    } = await sparQLService.getPublishResourcesByStatus(STATUSES.PUBLISHED);

    const {
      results: { bindings: signedResources }
    } = await sparQLService.getSignResourcesByStatus(STATUSES.PUBLISHED);

    const resources = blockchainService.getDistinctResources(
      publishedResources.concat(signedResources)
    );

    if (!isEmpty(resources)) {
      const responses = [];

      // eslint-disable-next-line
      for (const resource of resources) {
        const response = await requestPromise.post(
          `${config.decisionService}/decision/validate`, // TODO remove decisionService from config
          {
            method: "POST",
            body: resource,
            json: true
          }
        );
        responses.push(response);
      }
      res.status(httpStatus.OK).json({ responses });
    } else {
      logger.info("No resoucres found!");
      res.status(httpStatus.OK).json({ msg: "No resources found " });
    }
  } catch (e) {
    logger.error(`Error during validation ${e}`);
    next(e);
  }
};

const getByStatus = async (req, res, next) => {
  try {
    const { status } = req.params;
    const result = await sparQLService.getByStatus(status);
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    logger.error(`Error during query by status ${e}`);
    next(e);
  }
};

const getErrors = async (req, res, next) => {
  try {
    const result = await sparQLService.getErrors();
    res.status(httpStatus.OK).json({ result });
  } catch (e) {
    logger.error(`Error during query on errors ${e}`);
    next(e);
  }
};

const setup = async (req, res, next) => {
  try {
    logger.info("Adding resource");
    await sparQLService.insertResource(req.body);
    res.sendStatus(httpStatus.OK);
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

const reset = async (req, res, next) => {
  try {
    await sparQLService.reset();
    res.sendStatus(httpStatus.OK);
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

const setupByNumber = async (req, res, next) => {
  try {
    const { amount } = req.body;
    logger.info(`Adding ${amount} resources`);
    for (let index = 0; index < amount; index += 1) {
      if (index % 2 === 0) {
        const uri = Math.random().toString();
        await sparQLService.insertRandomResource("PublishedResource", uri);
        await sparQLService.insertRandomResource("SignedResource", uri);
        await sparQLService.insertRandomResource("SignedResource", uri);
        await sparQLService.insertRandomResource("BurnedResource", uri);
        await sparQLService.insertRandomResource("BurnedResource", uri);
      } else {
        await sparQLService.insertRandomResource();
      }
    }

    res.sendStatus(httpStatus.OK);
  } catch (e) {
    logger.error(e);
    next(e);
  }
};

export default {
  notify,
  getByStatus,
  validate,
  setup,
  reset,
  getErrors,
  setupByNumber
};
