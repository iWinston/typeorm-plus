import { Table } from "../../../../src/decorator/tables/Table";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { Column } from "../../../../src/decorator/columns/Column";

@Table()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;
}