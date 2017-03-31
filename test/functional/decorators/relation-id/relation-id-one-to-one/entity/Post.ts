import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../src/decorator/relations/JoinColumn";
import {Tag} from "./Tag";
import {RelationId} from "../../../../../../src/decorator/relations/RelationId";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @OneToOne(type => Tag)
    @JoinColumn()
    tag: Tag;

    @OneToOne(type => Tag, tag => tag.post)
    @JoinColumn()
    tag2: Tag;

    @RelationId((post: Post) => post.tag)
    tagId: number;

    @RelationId((post: Post) => post.tag2)
    tag2Id: number;

}