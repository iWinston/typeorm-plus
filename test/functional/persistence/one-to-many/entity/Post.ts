import {Category} from "./Category";
import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @OneToMany(type => Category, category => category.post)
    categories: Category[]|null;

    @Column()
    title: string;

}