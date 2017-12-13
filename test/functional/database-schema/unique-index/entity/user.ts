import { Entity } from "../../../../../src/decorator/entity/Entity";
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Column } from "../../../../../src/decorator/columns/Column";
import { Index } from "../../../../../src/decorator/Index";

@Entity()
@Index("unique_user_twitter_id", (user: User) => [user.twitter_id], { unique: true })
export class User {

    @PrimaryGeneratedColumn({ type: "int" })
    user_id: number;

    @Column()
    user_name: string;

    @Column({ length: 25 })
    twitter_id: string;

}