import {GeneratedPrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample19_post_metadata")
export class PostMetadata {

    @GeneratedPrimaryColumn()
    id: number;

    @Column("text")
    comment: string;

}