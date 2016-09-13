import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {SingleTableChild} from "../../../src/decorator/tables/SingleTableChild";

@SingleTableChild()
export class Employee extends Person {

    @Column()
    salary: number;

}