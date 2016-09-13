import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {ClassTableChild} from "../../../src/decorator/tables/ClassTableChild";

@ClassTableChild("sample29_student")
@ClassTableChild()
export class Student extends Person {

    @Column()
    faculty: string;

}