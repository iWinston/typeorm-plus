import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {ClassTableChild} from "../../../src/decorator/tables/ClassTableChild";

@ClassTableChild()
export class Student extends Person {

    @Column()
    faculty: string;

}