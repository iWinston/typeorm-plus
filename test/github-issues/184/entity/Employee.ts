import {Column} from "../../../../src/decorator/columns/Column";
import {Person, PersonType} from "./Person";
import {SingleEntityChild} from "../../../../src/decorator/entity/SingleEntityChild";
import {DiscriminatorValue} from "../../../../src/decorator/DiscriminatorValue";

@SingleEntityChild()
@DiscriminatorValue(PersonType.Employee) // required
export class Employee extends Person {

    @Column()
    salary: number;

    @Column()
    shared: string;

    constructor() {
        super()
        this.type = 1
    }

}