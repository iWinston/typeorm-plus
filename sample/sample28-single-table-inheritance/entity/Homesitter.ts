import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {Table} from "../../../src/decorator/tables/Table";
import {DiscriminatorName} from "../../../src/decorator/DiscriminatorValue";

@Table()
@DiscriminatorName("homesitter") // can be omitted
export class Homesitter extends Person {

    @Column()
    numberOfKids: number;

}