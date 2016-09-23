import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";

@Table()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category, {
        cascadeInsert: true
    })
    posts: Post[];

}