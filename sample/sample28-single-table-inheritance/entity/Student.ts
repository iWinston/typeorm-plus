import {Column} from "../../../src/decorator/columns/Column";
import {Person} from "./Person";
import {Table} from "../../../src/decorator/tables/Table";
import {DiscriminatorName} from "../../../src/decorator/DiscriminatorValue";

@Table()
@DiscriminatorName("student")
export class Student extends Person {

    @Column()
    faculty: string;

}