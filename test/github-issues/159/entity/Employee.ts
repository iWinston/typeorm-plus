import {Person} from "./Person";
import {ClassTableChild} from "../../../../src/decorator/tables/ClassTableChild";
import {Column} from "../../../../src/decorator/columns/Column";

@ClassTableChild()
export class Employee extends Person {

    @Column()
    salary: number;

}