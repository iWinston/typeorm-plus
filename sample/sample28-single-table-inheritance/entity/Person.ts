import {Column} from "../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../src/decorator/tables/TableInheritance";
import {DiscriminatorColumn} from "../../../src/decorator/columns/DiscriminatorColumn";
import {Table} from "../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";

// todo: some things left to do:
// * check how it works when is join (conditions are not added in the joins right now)

@Table("sample28_person")
@TableInheritance("single-table")
@DiscriminatorColumn({ name: "type", type: "string"})
export abstract class Person {

    @PrimaryColumn("int")
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}