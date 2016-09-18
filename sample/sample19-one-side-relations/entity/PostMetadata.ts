import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample19_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column("text")
    comment: string;

}