import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 13306,
  username: 'root',
  password: '1234',
  database: 'playground',
  synchronize: false,
  logging: false,
  entities: ['src/**/*.ts'],
  migrations: ['migration/**/*.ts'],
});
