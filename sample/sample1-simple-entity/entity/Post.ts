import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";

@Table("sample1_post")
export class Post {

    @PrimaryColumn("int", { isAutoIncrement: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

}