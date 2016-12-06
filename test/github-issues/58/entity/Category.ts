import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {OneToMany} from "../../../../src/decorator/relations/OneToMany";
import {PostCategory} from "./PostCategory";

@Table()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => PostCategory, postCategory => postCategory.category)
    posts: PostCategory[];

}