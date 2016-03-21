import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {ManyToMany} from "../../../src/decorator/Relations";
import {ManyToOne} from "../../../src/decorator/relations/ManyToOne";
import {OneToMany} from "../../../src/decorator/relations/OneToMany";
import {ManyToManyInverse} from "../../../src/decorator/relations/ManyToManyInverse";
import {OneToOne} from "../../../src/decorator/relations/OneToOne";
import {OneToOneInverse} from "../../../src/decorator/relations/OneToOneInverse";

@Table("sample8_category")
export class Category {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Category, category => category.oneInverseCategory, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    oneCategory: Category;

    @OneToOneInverse(type => Category, category => category.oneCategory, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    oneInverseCategory: Category;

   @ManyToOne(type => Category, category => category.oneManyCategories, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    oneManyCategory: Category;

    @OneToMany(type => Category, category => category.oneManyCategory, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    oneManyCategories: Category[] = [];

    @ManyToMany(type => Category, category => category.manyInverseCategories, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    manyCategories: Category[] = [];

    @ManyToManyInverse(type => Category, category => category.manyCategories, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    manyInverseCategories: Category[] = [];

}