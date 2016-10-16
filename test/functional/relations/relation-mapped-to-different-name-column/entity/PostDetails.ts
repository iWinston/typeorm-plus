import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";

@Table()
export class PostDetails {

    @PrimaryColumn()
    keyword: string;

}