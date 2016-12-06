import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {Category} from "./Category";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(() => Category, category => category.posts, {
        cascadeInsert: true
    })
    category: Promise<Category>;

}