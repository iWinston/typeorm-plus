import {PrimaryColumn, Column} from "../../../src/index";
import {Table} from "../../../src/index";

@Table("sample20_author")
export class Author {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;
    
}