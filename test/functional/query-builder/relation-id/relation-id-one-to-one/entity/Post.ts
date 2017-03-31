import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../src/decorator/relations/JoinColumn";
import {Tag} from "./Tag";

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
    
    tagId: number;

}