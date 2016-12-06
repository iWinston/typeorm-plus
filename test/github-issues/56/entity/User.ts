import {AccessToken} from "./AccessToken";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Table} from "../../../../src/decorator/tables/Table";

@Table()
export class User {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    email: string;

    @OneToOne(type => AccessToken)
    @JoinColumn()
    access_token: AccessToken;

}