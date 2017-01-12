import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {DiscriminatorValue} from "../../../src/decorator/DiscriminatorValue";
import {ClassEntityChild} from "../../../src/decorator/entity/ClassEntityChild";

@ClassEntityChild("sample29_homesitter")
@DiscriminatorValue("home-sitter") // can be omitted
export class Homesitter extends Person {

    @Column()
    numberOfKids: number;

}