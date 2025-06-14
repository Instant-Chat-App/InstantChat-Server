
import { AppDataSource } from "../config/data-source";
import { EntityTarget, ObjectLiteral, Repository } from "typeorm";

export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  constructor(entity: EntityTarget<T>) {
    super(entity, AppDataSource.manager);
  }
}