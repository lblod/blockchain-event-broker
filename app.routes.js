import { Router } from "express";

import notifyRoutes from "./endpoints/blockchain/blockchain.route";

export default Router()
  /** GET /health-check - Check service health */
  .get("/health-check", (req, res) =>
    res.send({ msg: "LBLOD Blockchain event broker up and running!" })
  )
  .use("/", notifyRoutes); // mount notify routes at /notify
