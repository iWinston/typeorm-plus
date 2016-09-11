import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {DiscriminatorValue} from "../../../src/decorator/DiscriminatorValue";
import {ChildTable} from "../../../src/decorator/tables/ChildTable";

@ChildTable()
@DiscriminatorValue("home-sitter") // can be omitted
export class Homesitter extends Person {

    @Column({ nullable: true })
    numberOfKids: number;

}