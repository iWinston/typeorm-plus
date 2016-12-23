import {Table} from "../../../../src/decorator/tables/Table";
import {TableInheritance} from "../../../../src/decorator/tables/TableInheritance";
import {DiscriminatorColumn} from "../../../../src/decorator/columns/DiscriminatorColumn";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Table()
@TableInheritance("class-table")
@DiscriminatorColumn({ name: "type", type: "string" })
export class Person {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}