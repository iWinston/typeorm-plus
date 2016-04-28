import {PrimaryColumn, Column} from "../../../src/columns";
import {AbstractTable} from "../../../src/decorator/tables/AbstractTable";

@AbstractTable()
export class BasePost {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @Column()
    title2312312: string;

}