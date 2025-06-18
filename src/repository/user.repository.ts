import { User } from "../entities/user.entity";
import { BaseRepository } from "./base.repository";

export default class UserRepository extends BaseRepository<User> {
    constructor() {
        super(User);
    }

    async getUserById(currentUserId: number, targetUserId: number) {
        const raw = await this.manager
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

        if (!raw) return null;

        const user = {
            userId: raw.u_user_id,
            fullName: raw.u_full_name,
            email: raw.u_email,
            avatar: raw.u_avatar,
            dob: raw.u_dob,
            gender: raw.u_gender,
            bio: raw.u_bio,
            isContact: raw.isContact
        };

        return user;
    }
}

