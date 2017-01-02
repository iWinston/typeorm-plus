import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";
import {Employee} from "./Employee";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";

@Table()
export class Department {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Employee, {
        cascadeInsert: true,
        nullable: false
    })
    @JoinColumn()
    manager: Employee;

}