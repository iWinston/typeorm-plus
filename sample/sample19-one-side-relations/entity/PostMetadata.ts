import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";

@Table("sample19_post_metadata")
export class PostMetadata {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column("text")
    comment: string;

}