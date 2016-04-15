import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";
import {ManyToMany} from "../../../src/decorator/relations";
import {PostCategory} from "./PostCategory";
import {PostAuthor} from "./PostAuthor";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {AbstractTable} from "../../../src/decorator/tables/AbstractTable";

@AbstractTable()
export class BasePost {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    title: string;

}