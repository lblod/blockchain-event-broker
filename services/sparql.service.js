import { update, query } from "mu";
import sha256 from "crypto-js/sha256";
import uuidv4 from "uuid/v4";
import { sample } from "lodash";

import { STATUSES } from "../utils/constants";

import {
  updateQuery,
  queryPublishResources,
  querySignResources,
  querySignResourcesWithError,
  updatePublishedQuery,
  deleteQuery,
  retryQuery,
  queryPublishResourcesWithError,
  queryErrors,
  deleteQueryErrors,
  insertAgendaQuery,
  queryAllResourcesWithErrors,
  queryAllResources
} from "../utils/queries";

export const getPublishResourcesByStatus = async status => {
  let unpublishedQuery;
  if (status === STATUSES.RETRY) {
    unpublishedQuery = queryPublishResourcesWithError(status);
  } else {
    unpublishedQuery = queryPublishResources(status);
  }
  return query(unpublishedQuery);
};

export const getSignResourcesByStatus = async status => {
  let signQuery;
  if (status === STATUSES.RETRY) {
    signQuery = querySignResourcesWithError(status);
  } else {
    signQuery = querySignResources(status);
  }
  return query(signQuery);
};

export const queryAllResourcesByStatus = async status => {
  const queryString =
    status === STATUSES.RETRY
      ? queryAllResourcesWithErrors(status)
      : queryAllResources(status);

  const {
    results: { bindings }
  } = await query(queryString);

  return bindings;
};

export const setResourceStatus = async (id, status, content = null) => {
  const updateStatusQuery =
    status === STATUSES.PUBLISHED
      ? updatePublishedQuery(id, content)
      : updateQuery(id, status);
  await update(updateStatusQuery);
};

export const insertResource = async params => {
  const { id, type, person } = params;
  const persons = [
    "45e2842b-e4ae-4593-a66f-551b8379d6b3",
    "385893a9-75d7-4557-9977-29999044b8aa",
    "eab29f18-3a50-4a89-842a-2255c8711ce6"
  ];
  const insertResourceQuery = insertAgendaQuery(
    uuidv4(),
    id === null ? uuidv4() : id,
    person === null ? uuidv4() : persons[person],
    type === "publish" ? "PublishedResource" : "SignedResource"
  );
  await update(insertResourceQuery);
};

export const insertRandomResource = async (type, resourceUri) => {
  const types = ["PublishedResource", "SignedResource", "BurnedResource"];
  const insertResourceQuery = insertAgendaQuery(
    uuidv4(), // id
    resourceUri || uuidv4(), // resourceUri
    `${Math.random()}${uuidv4()}`, // signatory
    type || sample(types) // Type
  );
  await update(insertResourceQuery);
};

export const getErrors = async () => {
  const unsignedQuery = queryErrors();
  const result = await query(unsignedQuery);

  const mapData = resource => ({
    id: resource.s.value,
    err: resource.err.value,
    count: resource.count.value,
    origin: resource.uuid.value
  });

  const errors = result.results.bindings.map(resource => mapData(resource));

  const distinctErrors = [];
  errors.forEach(error => {
    let con = true;
    distinctErrors.forEach(distinctError => {
      if (distinctError.origin === error.origin) {
        if (error.count <= distinctError.count) {
          con = false;
        }
      }
    });
    if (con) {
      const indexAlreadyExists = distinctErrors.findIndex(
        preError => preError.origin === error.origin
      );

      if (indexAlreadyExists !== -1) {
        distinctErrors.splice(indexAlreadyExists, 1, error);
      } else {
        distinctErrors.push(error);
      }
    }
  });

  return distinctErrors;
};

const getDistinct = async list => {
  const latestErrors = await getErrors();
  const distinctResources = [];
  list.forEach(resource => {
    const foundError = latestErrors.find(
      error => error.origin === resource.id && error.id === resource.hasError
    );
    if (foundError) {
      distinctResources.push(resource);
    }
  });
  return distinctResources;
};

export const getByStatus = async status => {
  const resultPublish = await getPublishResourcesByStatus(status);
  const resultSign = await getSignResourcesByStatus(status);

  const mapData = (resource, type) => ({
    id: resource.s.value,
    content: resource.content.value,
    signatory: resource.signatory.value,
    resourceId: resource.resourceUri.value,
    timestamp: resource.timestamp.value,
    resourceType: resource.type.value,
    hash: sha256(resource.content.value).toString(),
    hasError: resource.hasError ? resource.hasError.value : null,
    type
  });

  const publishedResources = resultPublish.results.bindings.map(resource =>
    mapData(resource, "Publishing")
  );

  const signedResources = resultSign.results.bindings.map(resource =>
    mapData(resource, "Signing")
  );

  const conc = publishedResources.concat(signedResources);
  if (status === STATUSES.RETRY) {
    return getDistinct(conc);
  }
  return conc;
};

const deleteResource = async id => {
  const deleteResourceQuery = deleteQuery(id);
  await update(deleteResourceQuery);
};

export const setResourceStatusRetry = async (id, e, count) => {
  const retryResourceQuery = retryQuery(
    id,
    count,
    uuidv4(),
    e.error.errors ? e.error.errors[0].title : "Unknown error" // TODO fix error
  );
  await update(retryResourceQuery);
};

export const reset = async () => {
  const unpublished = await getByStatus(STATUSES.UNPUBLISHED);
  const published = await getByStatus(STATUSES.PUBLISHED);
  const publishing = await getByStatus(STATUSES.PUBLISHING);
  const failed = await getByStatus(STATUSES.FAILED);
  const retry = await getByStatus(STATUSES.RETRY);
  const errors = await getErrors();

  const resources = Object.assign(
    [],
    unpublished instanceof Array ? unpublished : [],
    published instanceof Array ? published : [],
    publishing instanceof Array ? publishing : [],
    failed instanceof Array ? failed : [],
    retry instanceof Array ? retry : []
  );
  if (resources instanceof Array) {
    for (const resource of resources) {
      await deleteResource(resource.id);
    }
  }

  if (errors instanceof Array) {
    for (const resource of errors) {
      await deleteQueryErrors(resource.id);
    }
  }
};
