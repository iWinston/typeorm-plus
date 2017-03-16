import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {PostWithoutRelationId} from "./PostWithoutRelationId";
import {OneToMany} from "../../../../../../src/decorator/relations/OneToMany";

@Entity()
export class Tag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => PostWithoutRelationId, post => post.tag)
    postsWithoutRelationId: PostWithoutRelationId[];

    postIds: number[];

}