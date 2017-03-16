import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";
import {Tag} from "./Tag";

@Entity()
export class PostWithoutRelationId {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Tag, tag => tag.postsWithoutRelationId)
    tag: Tag;
    
    tagId: number;

}