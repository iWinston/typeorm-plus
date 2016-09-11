import {Column} from "../../../src/decorator/columns/Column";
import {Table} from "../../../src/decorator/tables/Table";
import {Person} from "./Person";

@Table()
// @DiscriminatorValue("employee")
export class Employee extends Person {

    @Column()
    salary: number;

}