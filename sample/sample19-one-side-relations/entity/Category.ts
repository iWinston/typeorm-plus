import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";

@Table("sample19_category")
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

}