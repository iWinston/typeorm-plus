import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {User} from "./User";

@Entity()
export class AccessToken {

    @PrimaryColumn("int", { generated: true })
    primaryKey: number;

    @OneToOne(type => User, user => user.access_token, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    user: User;

}