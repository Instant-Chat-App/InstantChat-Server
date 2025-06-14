import { User } from "../entities/user.entity";
import { BaseRepository } from "./base.repository";



export default class UserRepository extends BaseRepository<User> {
    constructor() {
        super(User);
    }
}