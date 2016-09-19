import {Table} from "../../../../../src/decorator/tables/Table";
import {GeneratedIdColumn} from "../../../../../src/decorator/columns/GeneratedIdColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Category} from "./Category";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";

@Table()
export class Blog {

    @GeneratedIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;
    
    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

    @Column()
    counter: number = 0;

}