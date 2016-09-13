import {Column} from "../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../src/decorator/TableInheritance";
import {DiscriminatorColumn} from "../../../src/decorator/columns/DiscriminatorColumn";
import {Table} from "../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";

@Table()
@TableInheritance("class-table")
@DiscriminatorColumn({ name: "type", type: "string"})
export abstract class Person {

    @PrimaryColumn("int"/*, { generated: true }*/)
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}