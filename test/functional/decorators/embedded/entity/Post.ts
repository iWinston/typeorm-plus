import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedIdColumn} from "../../../../../src/decorator/columns/GeneratedIdColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Counters} from "./Counters";
import {Embedded} from "../../../../../src/decorator/Embedded";

@Table()
export class Post {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Embedded(() => Counters)
    counters: Counters;

}