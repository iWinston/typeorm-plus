import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Counters} from "./Counters";
import {Embedded} from "../../../../../src/decorator/Embedded";

@Table()
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Embedded(() => Counters)
    counters: Counters;

}