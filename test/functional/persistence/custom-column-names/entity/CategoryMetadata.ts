import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedPrimaryColumn} from "../../../../../src/decorator/columns/GeneratedPrimaryColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {Category} from "./Category";

@Table()
export class CategoryMetadata {

    @GeneratedPrimaryColumn()
    id: number;
    
    @Column()
    keyword: string;

    @OneToOne(type => Category, category => category.metadata)
    category: Category;

}