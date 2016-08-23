import {PrimaryColumn, Column} from "../../../src/index";
import {AbstractTable} from "../../../src/decorator/tables/AbstractTable";

@AbstractTable()
export class BasePost {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

}