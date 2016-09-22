import {PrimaryGeneratedColumn, Column, Table} from "../../../src/index";

@Table("sample19_post_metadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("text")
    comment: string;

}