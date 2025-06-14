import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "123",
  database: "postgres",
  synchronize: false,
  logging: true,
  entities: [__dirname + "/../entities/*.ts"],
});
