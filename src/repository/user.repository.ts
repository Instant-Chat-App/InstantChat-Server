import { User } from "../entities/user.entity";
import { BaseRepository } from "./base.repository";

export default class UserRepository extends BaseRepository<User> {
    constructor() {
        super(User);
    }

    async getUserById(currentUserId: number, targetUserId: number) {
        return await this.manager
            .createQueryBuilder("users", "u")
            .leftJoin(
                "contacts",
                "c",
                "c.user_id = :currentUserId AND c.contact_id = u.user_id",
                { currentUserId }
            )
            .addSelect("CASE WHEN c.contact_id IS NOT NULL THEN true ELSE false END", "isContact")
            .where("u.user_id = :targetUserId", { targetUserId })
            .getRawOne();
    }

}