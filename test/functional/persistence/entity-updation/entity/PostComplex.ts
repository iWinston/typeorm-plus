import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {PostEmbedded} from "./PostEmbedded";

@Entity()
export class PostComplex {

    @PrimaryGeneratedColumn("uuid")
    firstId: number;

    @Column()
    text: string;

    @Column(type => PostEmbedded)
    embed: PostEmbedded;

}