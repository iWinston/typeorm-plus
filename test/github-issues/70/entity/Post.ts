import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {Category} from "./Category";
import {OneToMany} from "../../../../src/decorator/relations/OneToMany";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToMany(() => Category, category => category.post, {
        cascadeInsert: true
    })
    categories: Category[];

}