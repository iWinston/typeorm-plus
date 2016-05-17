import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";
import {Post} from "./Post";

@Table("sample25_author")
export class Author {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, author => author.author)
    posts: Post[];
    
}