import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {ManyToMany} from "../../../src/decorator/relations/ManyToMany";
import {Post} from "./Post";

@Table("sample18_category")
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;
    
    @ManyToMany(type => Post, post => post.categories)
    posts: Promise<Post[]>;

}