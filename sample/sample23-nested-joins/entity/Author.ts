import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";

@Table("sample23_author")
export class Author {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

}