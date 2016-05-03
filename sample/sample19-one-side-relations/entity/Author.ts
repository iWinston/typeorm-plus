import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";

@Table("sample19_author")
export class Author {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;
    
}