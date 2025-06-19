import { DataSource } from "typeorm";
import { getEnv } from "../utils/get-env.service";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: getEnv("DB_HOST", "localhost"),
  port: parseInt(getEnv("DB_PORT", "5432")),
  username: getEnv("DB_USER", "postgres"),
  password: getEnv("DB_PASSWORD", "123"),
  database: getEnv("DB_NAME", "instantchat"),
  synchronize: false,
  logging: true,
  entities: [__dirname + "/../entities/*{.ts,.js}"],
  migrations: [__dirname + "/../resources/*{.ts,.js}"]
});
