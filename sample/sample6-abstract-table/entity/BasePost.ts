import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {ManyToMany} from "../../../src/relations";
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