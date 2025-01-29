import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Joi from 'joi';
import { ENV } from '@playground/config';

export type EnvConfig = Record<string, any>;

export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    const config = dotenv.parse(fs.readFileSync(filePath));
    this.envConfig = this.validateInput(config);
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envValues = Object.keys(ENV).map((k) => ENV[k]);
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      PROJECT_NAME: Joi.string().required(),
      NODE_ENV: Joi.string()
        .valid(...envValues)
        .default(ENV.Development),

      MYSQL_HOST: Joi.string().required(),
      MYSQL_PORT: Joi.number().port().required(),
      MYSQL_DATABASE: Joi.string().required(),
      MYSQL_USERNAME: Joi.string().optional(),
      MYSQL_PASSWORD: Joi.string().optional(),
      MYSQL_POOL_SIZE: Joi.number().required(),

      REDIS_HOST: Joi.string().required(),
      REDIS_PORT: Joi.number().port().required(),

      USE_SENTRY: Joi.boolean().required(),
      SENTRY_DSN: Joi.when('USE_SENTRY', {
        is: true,
        then: Joi.string().uri().required(),
      }),

      RATE_LIMIT_REDIS_EXPIRE_SECONDS: Joi.number().required(),
    });

    const { error, value: validatedEnvConfig } = envVarsSchema.validate(envConfig);
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  get projectName(): string {
    return this.envConfig.PROJECT_NAME;
  }
  get environment(): ENV {
    return this.envConfig.NODE_ENV;
  }
  get mysqlHost(): string {
    return this.envConfig.MYSQL_HOST;
  }
  get mysqlPort(): number {
    return parseInt(this.envConfig.MYSQL_PORT, 10);
  }
  get mysqlDatabase(): string {
    return this.envConfig.MYSQL_DATABASE;
  }
  get mysqlUsername(): string {
    return this.envConfig.MYSQL_USERNAME;
  }
  get mysqlPassword(): string {
    return this.envConfig.MYSQL_PASSWORD;
  }
  get mysqlPoolSize(): number {
    return this.envConfig.MYSQL_POOL_SIZE;
  }
  get redisHost(): string {
    return this.envConfig.REDIS_HOST;
  }
  get redisPort(): number {
    return this.envConfig.REDIS_PORT;
  }
  get useSentry(): boolean {
    return this.envConfig.USE_SENTRY;
  }
  get sentryDSN(): string {
    return this.envConfig.SENTRY_DSN;
  }
  get rateLimitRedisExpireSeconds(): number {
    return this.envConfig.RATE_LIMIT_REDIS_EXPIRE_SECONDS;
  }
}

export const config = new ConfigService('.env');
