import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";

@Entity()
export class Category {

    @PrimaryColumn("int", {generated: true, name: "theId"})
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.category, {
        cascadeInsert: true
    })
    posts: Post[];

}