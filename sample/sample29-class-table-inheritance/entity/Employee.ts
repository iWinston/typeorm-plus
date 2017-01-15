import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {ClassEntityChild} from "../../../src/decorator/entity/ClassEntityChild";

@ClassEntityChild("sample29_employee")
export class Employee extends Person {

    @Column()
    salary: number;

}