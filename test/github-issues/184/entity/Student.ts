import {Column} from "../../../../src/decorator/columns/Column";
import {Person, PersonType} from "./Person";
import {SingleEntityChild} from "../../../../src/decorator/entity/SingleEntityChild";
import {DiscriminatorValue} from "../../../../src/decorator/DiscriminatorValue";

@SingleEntityChild()
@DiscriminatorValue(PersonType.Student) // required
export class Student extends Person {

    @Column()
    faculty: string;

    constructor() {
        super()
        this.type = 3
    }

}