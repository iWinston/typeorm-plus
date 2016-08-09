import {PrimaryColumn, Column} from "../../../src/index";
import {TreeLevelColumn} from "../../../src/decorator/tree/TreeLevelColumn";
import {ClosureTable} from "../../../src/decorator/tables/ClosureTable";
import {TreeParent} from "../../../src/decorator/tree/TreeParent";
import {TreeChildren} from "../../../src/decorator/tree/TreeChildren";

@ClosureTable("sample22_category")
export class Category {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;
    
    @TreeParent()
    parentCategory: Category;

    @TreeChildren({ cascadeAll: true })
    childCategories: Category[];

    @TreeLevelColumn()
    level: number;

    // todo:
    // @RelationsCountColumn()
    // categoriesCount: number;

}