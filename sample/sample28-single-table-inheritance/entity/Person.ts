import {AbstractTable} from "../../../src/decorator/tables/AbstractTable";
import {Column} from "../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../src/decorator/TableInheritance";
import {DiscriminatorColumn} from "../../../src/decorator/columns/DiscriminatorColumn";

@AbstractTable()
@TableInheritance("single-table") // also can be a class-table
@DiscriminatorColumn({ name: "type", type: "string"})
export abstract class Person {

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}