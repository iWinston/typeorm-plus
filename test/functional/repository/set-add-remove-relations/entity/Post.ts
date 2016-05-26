import {Category} from "./Category";
import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";

@Table()
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @OneToMany(type => Category, category => category.post)
    categories: Category[]|null;

    @ManyToMany(type => Category, category => category.manyPosts)
    @JoinTable()
    manyCategories: Category[];

}