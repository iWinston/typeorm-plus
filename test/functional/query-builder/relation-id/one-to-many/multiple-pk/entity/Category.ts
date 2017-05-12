import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {Index} from "../../../../../../../src/decorator/Index";
import {PrimaryColumn} from "../../../../../../../src/decorator/columns/PrimaryColumn";
import {ManyToOne} from "../../../../../../../src/decorator/relations/ManyToOne";

@Entity()
@Index(["id", "code"])
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    code: number;

    @Column()
    name: string;

    @ManyToOne(type => Post, post => post.categories)
    post: Post;

    postId: number;

}