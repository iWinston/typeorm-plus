import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Category} from "./Category";
import {Author} from "./Author";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";

@Table("sample23_post")
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category, {
        cascadeAll: true
    })
    @JoinTable()
    categories: Category[];

    @ManyToOne(type => Author, { cascadeInsert: true })
    author: Author|null;

}