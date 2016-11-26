import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";

@Table()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Post, post => post.categories, {
        onDelete: "CASCADE"
    })
    post: Post;

}