import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";
import {Post} from "./Post";

@Table("sample25_author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, author => author.author)
    posts: Post[];
    
}