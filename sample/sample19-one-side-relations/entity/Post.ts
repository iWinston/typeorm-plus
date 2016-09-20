import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";
import {Author} from "./Author";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../src/decorator/relations/JoinTable";
import {OneToOne} from "../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../src/decorator/relations/JoinColumn";
import {PostMetadata} from "./PostMetadata";

@Table("sample19_post")
export class Post {

    @GeneratedPrimaryColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToOne(type => Author, { cascadeAll: true })
    author: Author;

    @ManyToMany(type => Category, { cascadeAll: true })
    @JoinTable()
    categories: Category[];

    @OneToOne(type => PostMetadata, { cascadeAll: true })
    @JoinColumn()
    metadata: PostMetadata;

}