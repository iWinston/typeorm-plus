import {Column} from "../../../../src/decorator/columns/Column";
import {Person, PersonType} from "./Person";
import {DiscriminatorValue} from "../../../../src/decorator/DiscriminatorValue";
import {SingleEntityChild} from "../../../../src/decorator/entity/SingleEntityChild";

@SingleEntityChild()
@DiscriminatorValue(PersonType.Homesitter) // required
export class Homesitter extends Person {

    @Column()
    numberOfKids: number;

    @Column()
    shared: string;

    constructor() {
        super()
        this.type = 2
    }

}