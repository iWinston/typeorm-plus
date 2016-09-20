import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";
import {Counters} from "./Counters";
import {Embedded} from "../../../src/decorator/Embedded";

@Table("sample26_post")
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;
    
    @Embedded(type => Counters)
    counters: Counters;

}