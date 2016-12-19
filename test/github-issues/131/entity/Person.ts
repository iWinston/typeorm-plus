import {Column} from "../../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../../src/decorator/tables/TableInheritance";
import {DiscriminatorColumn} from "../../../../src/decorator/columns/DiscriminatorColumn";
import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";

@Table()
@TableInheritance("single-table")
@DiscriminatorColumn({ name: "type", type: "string" })
export class Person {

    @PrimaryColumn("int")
    id: number;

    @Column()
    name: string;

}
