import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Table} from "../../../../src/decorator/tables/Table";

@Table()
export class AccessToken {

    @PrimaryColumn()
    access_token: string;

}