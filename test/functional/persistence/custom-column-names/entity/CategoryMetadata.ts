import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {Category} from "./Category";

@Table()
export class CategoryMetadata {

    @PrimaryColumn("int", { generated: true })
    id: number;
    
    @Column()
    keyword: string;

    @OneToOne(type => Category, category => category.metadata)
    category: Category;

}