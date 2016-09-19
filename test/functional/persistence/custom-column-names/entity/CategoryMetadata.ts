import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedIdColumn} from "../../../../../src/decorator/columns/GeneratedIdColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {Category} from "./Category";

@Table()
export class CategoryMetadata {

    @GeneratedIdColumn()
    id: number;
    
    @Column()
    keyword: string;

    @OneToOne(type => Category, category => category.metadata)
    category: Category;

}