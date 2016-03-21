import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToMany} from "../../../src/decorator/Relations";
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