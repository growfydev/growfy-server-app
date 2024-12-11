import * as Joi from 'joi';

/**
 * @description This is the schema validator for the environment variables.
 * @param {Joi.ObjectSchema} envSchema - The schema to validate the environment variables against.
 * @returns {Joi.ValidationResult} The result of the validation.
 */

export const envSchema = Joi.object({
	// Server Configuration
	PORT: Joi.string().required(),

	// JWT Configuration
	JWT_SECRET: Joi.string().required(),
	REFRESH_SECRET_KEY: Joi.string().required(),

	// Database Configuration
	DB_USER: Joi.string().required(),
	DB_PASSWORD: Joi.string().required(),
	DB_HOST: Joi.string().required(),
	DB_PORT: Joi.number().required(),
	DB_NAME: Joi.string().required(),

	// SMS Service Configuration
	SMS_ACCOUNTID: Joi.string().required(),
	SMS_AUTH_TOKEN: Joi.string().required(),
	SMS_FROM: Joi.string().required(),

	// Stripe Configuration
	STRIPE_API_KEY: Joi.string().required(),

	// Redis Configuration
	REDIS_HOST: Joi.string().required(),
	REDIS_PORT: Joi.number().required(),

	// AWS Configuration
	AWS_ACCESS_KEY_ID: Joi.string().required(),
	AWS_SECRET_ACCESS_KEY: Joi.string().required(),
	AWS_S3_BUCKET_NAME: Joi.string().required(),
	AWS_REGION: Joi.string().required(),
});
