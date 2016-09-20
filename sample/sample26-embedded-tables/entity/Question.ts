import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";
import {Counters} from "./Counters";
import {Embedded} from "../../../src/decorator/Embedded";

@Table("sample26_question")
export class Question {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Embedded(type => Counters)
    counters: Counters;
    
}