import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Table} from "../../../../src/decorator/tables/Table";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {User} from "./User";

@Table()
export class AccessToken {

    @PrimaryColumn("int", { generated: true })
    primaryKey: number;

    @OneToOne(type => User, user => user.access_token, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    user: User;

}