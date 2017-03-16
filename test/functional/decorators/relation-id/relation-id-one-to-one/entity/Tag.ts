import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {PostWithoutRelationId} from "./PostWithoutRelationId";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";

@Entity()
export class Tag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => PostWithoutRelationId, post => post.tag2)
    post: PostWithoutRelationId;

    postId: number;

}