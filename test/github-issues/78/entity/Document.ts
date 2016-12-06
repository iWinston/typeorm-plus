import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {TableInheritance} from "../../../../src/decorator/tables/TableInheritance";
import {CreateDateColumn} from "../../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../src/decorator/columns/UpdateDateColumn";

@Table()
@TableInheritance("class-table")
export class Document {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    dollarRate: number = 0;

    @Column()
    orderBy: string = "";

    @Column()
    comments: string = "";

    @Column()
    subTotal: number = 0;

    @Column()
    vat: number = 0;

    @Column()
    total: number = 0;

    @Column()
    createdBy: string = "";

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

}