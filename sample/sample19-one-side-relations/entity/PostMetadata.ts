import {GeneratedIdColumn, Column, Table} from "../../../src/index";

@Table("sample19_post_metadata")
export class PostMetadata {

    @GeneratedIdColumn()
    id: number;

    @Column("text")
    comment: string;

}