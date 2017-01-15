import {Person} from "./Person";
import {ClassEntityChild} from "../../../../src/decorator/entity/ClassEntityChild";
import {Column} from "../../../../src/decorator/columns/Column";

@ClassEntityChild()
export class Employee extends Person {

    @Column()
    salary: number;

}