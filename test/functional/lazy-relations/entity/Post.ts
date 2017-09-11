import { Entity } from "../../../../src/decorator/entity/Entity";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn";
import { Column } from "../../../../src/decorator/columns/Column";
import { ManyToMany } from "../../../../src/decorator/relations/ManyToMany";
import { JoinTable } from "../../../../src/decorator/relations/JoinTable";
import { ManyToOne } from "../../../../src/decorator/relations/ManyToOne";
import { OneToOne } from "../../../../src/decorator/relations/OneToOne";
import { JoinColumn } from "../../../../src/decorator/relations/JoinColumn";
import {
    Category,
    CategoryNamedAll,
    CategoryNamedTable,
    CategoryNamedColumn,
} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Promise<Category[]>;

    @ManyToMany(type => Category, category => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>;

    @Column()
    viewCount: number = 0;

    @ManyToOne(type => Category)
    category: Promise<Category>;

    @OneToOne(type => Category, category => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>;

    @ManyToOne(type => Category, category => category.twoSidePosts2)
    twoSideCategory: Promise<Category>;

    // ManyToMany with named properties
    @ManyToMany(type => CategoryNamedTable, category => category.postsNamedTable)
    @JoinTable()
    categoriesNamedTable: Promise<CategoryNamedTable[]>;

    @ManyToMany(type => CategoryNamedColumn, category => category.postsNamedColumn)
    @JoinTable()
    categoriesNamedColumn: Promise<CategoryNamedColumn[]>;

    @ManyToMany(type => CategoryNamedAll, category => category.postsNamedAll)
    @JoinTable()
    categoriesNamedAll: Promise<CategoryNamedAll[]>;

    // ManyToOne with named properties
    @ManyToOne(type => CategoryNamedTable, category => category.onePostsNamedTable)
    @JoinColumn()
    categoryNamedTable: Promise<CategoryNamedTable>;

    @ManyToOne(type => CategoryNamedColumn, category => category.onePostsNamedColumn)
    @JoinColumn({
        name: "s_category_named_column_id"
    })
    categoryNamedColumn: Promise<CategoryNamedColumn>;

    @ManyToOne(type => CategoryNamedAll, category => category.onePostsNamedAll)
    @JoinColumn({
        name: "s_category_named_all_id"
    })
    categoryNamedAll: Promise<CategoryNamedAll>;

    // OneToOne with named properties
    @OneToOne(type => CategoryNamedTable, category => category.onePostNamedTable)
    @JoinColumn()
    oneCategoryNamedTable: Promise<CategoryNamedTable>;

    @OneToOne(type => CategoryNamedColumn, category => category.onePostNamedColumn)
    @JoinColumn({
        name: "s_one_category_named_column_id"
    })
    oneCategoryNamedColumn: Promise<CategoryNamedColumn>;

    @OneToOne(type => CategoryNamedAll, category => category.onePostNamedAll)
    @JoinColumn({
        name: "s_one_category_named_all_id"
    })
    oneCategoryNamedAll: Promise<CategoryNamedAll>;
}

@Entity("s_post", {
    orderBy: {
        title: "ASC",
        id: "DESC",
    }
})
export class PostNamedTable {

    @PrimaryColumn("int")
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Promise<Category[]>;

    @ManyToMany(type => Category, category => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>;

    @Column()
    viewCount: number = 0;

    @ManyToOne(type => Category)
    category: Promise<Category>;

    @OneToOne(type => Category, category => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>;

    @ManyToOne(type => Category, category => category.twoSidePosts2)
    twoSideCategory: Promise<Category>;

    // ManyToMany with named properties
    @ManyToMany(type => CategoryNamedTable, category => category.postsNamedTable)
    @JoinTable()
    categoriesNamedTable: Promise<CategoryNamedTable[]>;

    @ManyToMany(type => CategoryNamedColumn, category => category.postsNamedColumn)
    @JoinTable()
    categoriesNamedColumn: Promise<CategoryNamedColumn[]>;

    @ManyToMany(type => CategoryNamedAll, category => category.postsNamedAll)
    @JoinTable()
    categoriesNamedAll: Promise<CategoryNamedAll[]>;

    // ManyToOne with named properties
    @ManyToOne(type => CategoryNamedTable, category => category.onePostsNamedTable)
    @JoinColumn()
    categoryNamedTable: Promise<CategoryNamedTable>;

    @ManyToOne(type => CategoryNamedColumn, category => category.onePostsNamedColumn)
    @JoinColumn({
        name: "s_category_named_column_id"
    })
    categoryNamedColumn: Promise<CategoryNamedColumn>;

    @ManyToOne(type => CategoryNamedAll, category => category.onePostsNamedAll)
    @JoinColumn({
        name: "s_category_named_all_id"
    })
    categoryNamedAll: Promise<CategoryNamedAll>;

    // OneToOne with named properties
    @OneToOne(type => CategoryNamedTable, category => category.onePostNamedTable)
    @JoinColumn()
    oneCategoryNamedTable: Promise<CategoryNamedTable>;

    @OneToOne(type => CategoryNamedColumn, category => category.onePostNamedColumn)
    @JoinColumn({
        name: "s_one_category_named_column_id"
    })
    oneCategoryNamedColumn: Promise<CategoryNamedColumn>;

    @OneToOne(type => CategoryNamedAll, category => category.onePostNamedAll)
    @JoinColumn({
        name: "s_one_category_named_all_id"
    })
    oneCategoryNamedAll: Promise<CategoryNamedAll>;

}

@Entity()
export class PostNamedColumn {

    @PrimaryColumn("int", {
        name: "s_post_id"
    })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Promise<Category[]>;

    @ManyToMany(type => Category, category => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>;

    @Column()
    viewCount: number = 0;

    @ManyToOne(type => Category)
    category: Promise<Category>;

    @OneToOne(type => Category, category => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>;

    @ManyToOne(type => Category, category => category.twoSidePosts2)
    twoSideCategory: Promise<Category>;

    // ManyToMany with named properties
    @ManyToMany(type => CategoryNamedTable, category => category.postsNamedTable)
    @JoinTable()
    categoriesNamedTable: Promise<CategoryNamedTable[]>;

    @ManyToMany(type => CategoryNamedColumn, category => category.postsNamedColumn)
    @JoinTable()
    categoriesNamedColumn: Promise<CategoryNamedColumn[]>;

    @ManyToMany(type => CategoryNamedAll, category => category.postsNamedAll)
    @JoinTable()
    categoriesNamedAll: Promise<CategoryNamedAll[]>;

    // ManyToOne with named properties
    @ManyToOne(type => CategoryNamedTable, category => category.onePostsNamedTable)
    @JoinColumn()
    categoryNamedTable: Promise<CategoryNamedTable>;

    @ManyToOne(type => CategoryNamedColumn, category => category.onePostsNamedColumn)
    @JoinColumn({
        name: "s_category_named_column_id"
    })
    categoryNamedColumn: Promise<CategoryNamedColumn>;

    @ManyToOne(type => CategoryNamedAll, category => category.onePostsNamedAll)
    @JoinColumn({
        name: "s_category_named_all_id"
    })
    categoryNamedAll: Promise<CategoryNamedAll>;

    // OneToOne with named properties
    @OneToOne(type => CategoryNamedTable, category => category.onePostNamedTable)
    @JoinColumn()
    oneCategoryNamedTable: Promise<CategoryNamedTable>;

    @OneToOne(type => CategoryNamedColumn, category => category.onePostNamedColumn)
    @JoinColumn({
        name: "s_one_category_named_column_id"
    })
    oneCategoryNamedColumn: Promise<CategoryNamedColumn>;

    @OneToOne(type => CategoryNamedAll, category => category.onePostNamedAll)
    @JoinColumn({
        name: "s_one_category_named_all_id"
    })
    oneCategoryNamedAll: Promise<CategoryNamedAll>;
}

@Entity("s_post_named_all", {
    orderBy: {
        title: "ASC",
        id: "DESC",
    }
})
export class PostNamedAll {

    @PrimaryColumn("int", {
        name: "s_post_id"
    })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Promise<Category[]>;

    @ManyToMany(type => Category, category => category.twoSidePosts)
    @JoinTable()
    twoSideCategories: Promise<Category[]>;

    @Column()
    viewCount: number = 0;

    @ManyToOne(type => Category)
    category: Promise<Category>;

    @OneToOne(type => Category, category => category.onePost)
    @JoinColumn()
    oneCategory: Promise<Category>;

    @ManyToOne(type => Category, category => category.twoSidePosts2)
    twoSideCategory: Promise<Category>;

    // ManyToMany with named properties
    @ManyToMany(type => CategoryNamedTable, category => category.postsNamedTable)
    @JoinTable()
    categoriesNamedTable: Promise<CategoryNamedTable[]>;

    @ManyToMany(type => CategoryNamedColumn, category => category.postsNamedColumn)
    @JoinTable()
    categoriesNamedColumn: Promise<CategoryNamedColumn[]>;

    @ManyToMany(type => CategoryNamedAll, category => category.postsNamedAll)
    @JoinTable()
    categoriesNamedAll: Promise<CategoryNamedAll[]>;

    // ManyToOne with named properties
    @ManyToOne(type => CategoryNamedTable, category => category.onePostsNamedTable)
    @JoinColumn()
    categoryNamedTable: Promise<CategoryNamedTable>;

    @ManyToOne(type => CategoryNamedColumn, category => category.onePostsNamedColumn)
    @JoinColumn({
        name: "s_category_named_column_id"
    })
    categoryNamedColumn: Promise<CategoryNamedColumn>;

    @ManyToOne(type => CategoryNamedAll, category => category.onePostsNamedAll)
    @JoinColumn({
        name: "s_category_named_all_id"
    })
    categoryNamedAll: Promise<CategoryNamedAll>;

    // OneToOne with named properties
    @OneToOne(type => CategoryNamedTable, category => category.onePostNamedTable)
    @JoinColumn()
    oneCategoryNamedTable: Promise<CategoryNamedTable>;

    @OneToOne(type => CategoryNamedColumn, category => category.onePostNamedColumn)
    @JoinColumn({
        name: "s_one_category_named_column_id"
    })
    oneCategoryNamedColumn: Promise<CategoryNamedColumn>;

    @OneToOne(type => CategoryNamedAll, category => category.onePostNamedAll)
    @JoinColumn({
        name: "s_one_category_named_all_id"
    })
    oneCategoryNamedAll: Promise<CategoryNamedAll>;
}