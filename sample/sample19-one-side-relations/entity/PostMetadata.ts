import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";

@Entity("sample19_post_metadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    comment: string;

}