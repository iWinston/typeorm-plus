import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {ChildTable} from "../../../src/decorator/tables/ChildTable";

@ChildTable()
export class Employee extends Person {

    @Column({ nullable: true })
    salary: number;

}