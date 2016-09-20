import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Tag {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    name: string;

}