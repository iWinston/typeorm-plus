import {Category} from "./Category";
import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @OneToMany(type => Category, category => category.post)
    categories: Category[]|null;

    @Column()
    title: string;

}