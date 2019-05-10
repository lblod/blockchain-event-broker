import Joi from "joi";

export const getByStatusScheme = {
  params: {
    status: Joi.string().required()
  }
};
