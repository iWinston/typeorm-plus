import {Column} from "../../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../../src/decorator/entity/TableInheritance";
import {DiscriminatorColumn} from "../../../../src/decorator/columns/DiscriminatorColumn";
import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";

export enum PersonType {
    Employee = 1,
    Homesitter = 2,
    Student = 3
}

abstract class Base {

    @PrimaryColumn("int")
    id: number;
}

@Entity("issue184_person")
@TableInheritance("single-table")
@DiscriminatorColumn({ name: "type", type: "int"})
export abstract class Person  {

    @PrimaryColumn("string", { generated: false })
    id: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    type: PersonType

}