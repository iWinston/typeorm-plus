import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedIdColumn} from "../../../../../src/decorator/columns/GeneratedIdColumn";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Post {

    @GeneratedIdColumn()
    id: number|undefined|null|string;

    @Column()
    title: string;

}