import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {DiscriminatorValue} from "../../../src/decorator/DiscriminatorValue";
import {ClassTableChild} from "../../../src/decorator/tables/ClassTableChild";

@ClassTableChild("sample29_homesitter")
@DiscriminatorValue("home-sitter") // can be omitted
export class Homesitter extends Person {

    @Column()
    numberOfKids: number;

}