import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";

@Table("sample2_post_category")
export class PostCategory {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

}