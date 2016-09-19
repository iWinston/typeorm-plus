import {GeneratedIdColumn, Column, Table} from "../../../src/index";
import {Counters} from "./Counters";
import {Embedded} from "../../../src/decorator/Embedded";

@Table("sample26_question")
export class Question {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Embedded(type => Counters)
    counters: Counters;
    
}