import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Author} from "./Author";
import {Category} from "./Category";

@Table("sample20_post")
export class Post {

    @PrimaryColumn("int")
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    author: Author;

    categories: Category[];

}