import {GeneratedPrimaryColumn, Column} from "../../../src/index";
import {AbstractTable} from "../../../src/decorator/tables/AbstractTable";

@AbstractTable()
export class BasePost {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

}