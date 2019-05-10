import { app, errorHandler } from "mu";

import routes from "./app.routes";
import logger from "./config/Log";

logger.info("=========== STARTING UP EVENT BROKER SERVER ===========");
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(routes);
app.use(errorHandler);

// start server
app.listen(80, () =>
  logger.info(
    `Started event broker server on port 80 in ${app.get("env")} mode`
  )
);
