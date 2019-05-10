import Joi from "joi";

// require and configure dotenv, will load vars in .env in PROCESS.ENV
import dotenv from "dotenv";

dotenv.config();

// define validation for all the env vars
const envVarsSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .allow(["development", "production", "test", "provision"])
    .default("development")
})
  .unknown()
  .required();

const { error, value: envVars } = Joi.validate(process.env, envVarsSchema);

if (error) {
  throw new Error(
    `Check your '.env' file (located at the root of this project),
    validation error: ${error.message}`
  );
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  decisionService: "http://decisionservice"
};

if (config.env === "test") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;
}

export default config;
