import * as Joi from 'joi';

export const envSchema = Joi.object({
	PORT: Joi.string().required(),
	DATABASE_URL: Joi.string().required(),
});
