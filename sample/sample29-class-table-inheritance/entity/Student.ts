import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {ClassEntityChild} from "../../../src/decorator/entity/ClassEntityChild";

@ClassEntityChild("sample29_student")
@ClassEntityChild()
export class Student extends Person {

    @Column()
    faculty: string;

}