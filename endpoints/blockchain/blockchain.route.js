import { Router } from "express";
import validate from "express-validation";

import blockchainCtrl from "./blockchain.controller";
import config from "../../config/config";
import { getByStatusScheme } from "./blockchain.param.validation";

const router = Router(); // eslint-disable-line new-cap

router.route("/notify").post(blockchainCtrl.notify);
router
  .route("/getByStatus/:status")
  .get(validate(getByStatusScheme), blockchainCtrl.getByStatus);
router.route("/validateAll").post(blockchainCtrl.validate);
router.route("/getErrors").post(blockchainCtrl.getErrors);

if (config.env === "development") {
  router.route("/setup").post(blockchainCtrl.setup);
  router.route("/reset").post(blockchainCtrl.reset);
  router.route("/setupByNumber").post(blockchainCtrl.setupByNumber);
}

export default router;
