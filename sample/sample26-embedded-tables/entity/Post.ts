import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {Counters} from "./Counters";
import {Embedded} from "../../../src/decorator/Embedded";

@Table("sample26_post")
export class Post {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;
    
    @Embedded(type => Counters)
    counters: Counters;

}