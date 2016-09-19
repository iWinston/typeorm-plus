import {Table} from "../../../../../src/decorator/tables/Table";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";

@Table()
export class Post {

    @PrimaryColumn("int")
    id: number;

    @Column()
    title: string;
    
    @Column()
    categoryName: string;
    
    @Column()
    isNew: boolean = false;

}