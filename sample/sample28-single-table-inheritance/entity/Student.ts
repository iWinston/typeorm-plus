import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {ChildTable} from "../../../src/decorator/tables/ChildTable";

@ChildTable()
export class Student extends Person {

    @Column({ nullable: true })
    faculty: string;

}