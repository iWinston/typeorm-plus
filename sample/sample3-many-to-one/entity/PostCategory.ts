import {PrimaryColumn, Column} from "../../../src/decorator/columns";
import {Table} from "../../../src/decorator/tables";

@Table("sample3_post_category")
export class PostCategory {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

}