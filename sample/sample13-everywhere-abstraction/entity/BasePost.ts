import {GeneratedIdColumn, Column} from "../../../src/index";
import {AbstractTable} from "../../../src/decorator/tables/AbstractTable";

@AbstractTable()
export class BasePost {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    title2312312: string;

}