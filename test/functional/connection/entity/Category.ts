import {ClosureTable} from "../../../../src/decorator/tables/ClosureTable";
import {GeneratedIdColumn} from "../../../../src/decorator/columns/GeneratedIdColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {TreeParent} from "../../../../src/decorator/tree/TreeParent";
import {TreeChildren} from "../../../../src/decorator/tree/TreeChildren";
import {TreeLevelColumn} from "../../../../src/decorator/tree/TreeLevelColumn";

@ClosureTable("CaTeGoRy")
export class Category {

    @GeneratedIdColumn()
    id: number;

    @Column()
    name: string;
    
    @TreeParent()
    parentCategory: Category;

    @TreeChildren({ cascadeAll: true })
    childCategories: Category[];

    @TreeLevelColumn()
    level: number;

}