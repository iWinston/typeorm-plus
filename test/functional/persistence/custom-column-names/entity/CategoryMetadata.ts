import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {Category} from "./Category";

@Table()
export class CategoryMetadata {

    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    keyword: string;

    @OneToOne(type => Category, category => category.metadata)
    category: Category;

}