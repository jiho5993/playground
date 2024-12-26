import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

export const MysqlConfigServiceFactory = (config: any, entities: any[]) => {
  class Config implements TypeOrmOptionsFactory {
    createTypeOrmOptions(): TypeOrmModuleOptions {
      console.log();
      return {
        type: 'mysql',
        host: config.mysqlHost,
        port: config.mysqlPort,
        username: config.mysqlUsername,
        password: config.mysqlPassword,
        database: config.mysqlDatabase,
        timezone: 'Z',
        logging: false,
        synchronize: false,
        keepConnectionAlive: true,
        extra: {
          connectionLimit: config.mysqlConnectionLimit,
        },
        autoLoadEntities: false,
        entities,
      };
    }
  }

  return Config;
};
