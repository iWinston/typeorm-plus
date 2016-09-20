import {Category} from "./Category";
import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";

@Table()
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column("int", { nullable: true })
    categoryId: number;

    @ManyToOne(type => Category, category => category.posts, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    @JoinColumn({ name: "categoryId" })
    category: Category;

}