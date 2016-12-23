import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../src/decorator/Embedded";
import {Counters} from "./Counters";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @Embedded(() => Counters)
    counters: Counters;

}