import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";

@Table("sample4_post_category")
export class PostCategory {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;
    
    constructor(name?: string) {
        this.name = name;
    }

}