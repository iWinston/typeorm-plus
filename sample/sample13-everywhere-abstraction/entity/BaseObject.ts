import {PrimaryColumn, Column} from "../../../src/columns";
import {AbstractTable} from "../../../src/decorator/tables/AbstractTable";
import {BasePost} from "./BasePost";

@AbstractTable()
export class BaseObject extends BasePost {

    @PrimaryColumn("double", { generated: true })
    id: number;

    @Column()
    title: string;

}