import { Entity } from "../../../../src/decorator/entity/Entity";
import { PrimaryGeneratedColumn } from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn";
import { Column } from "../../../../src/decorator/columns/Column";
import { ManyToMany } from "../../../../src/decorator/relations/ManyToMany";
import { OneToMany } from "../../../../src/decorator/relations/OneToMany";
import { OneToOne } from "../../../../src/decorator/relations/OneToOne";
import {
    Post,
    PostNamedAll,
    PostNamedTable,
    PostNamedColumn,
} from "./Post";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.oneCategory)
    onePost: Promise<Post>;

    @ManyToMany(type => Post, post => post.twoSideCategories)
    twoSidePosts: Promise<Post[]>;

    @OneToMany(type => Post, post => post.twoSideCategory)
    twoSidePosts2: Promise<Post[]>;

    // ManyToMany with named properties
    @ManyToMany(type => PostNamedTable, post => post.categoriesNamedTable)
    postsNamedTable: Promise<PostNamedTable[]>;

    @ManyToMany(type => PostNamedColumn, post => post.categoriesNamedColumn)
    postsNamedColumn: Promise<PostNamedColumn[]>;

    @ManyToMany(type => PostNamedAll, post => post.categoriesNamedAll)
    postsNamedAll: Promise<PostNamedAll[]>;

    // OneToMany with named properties
    @OneToMany(type => PostNamedTable, post => post.categoryNamedTable)
    onePostsNamedTable: Promise<PostNamedTable[]>;

    @OneToMany(type => PostNamedColumn, post => post.categoryNamedColumn)
    onePostsNamedColumn: Promise<PostNamedColumn[]>;

    @OneToMany(type => PostNamedAll, post => post.categoryNamedAll)
    onePostsNamedAll: Promise<PostNamedAll[]>;

    // OneToOne with named properties
    @OneToOne(type => PostNamedTable, post => post.oneCategoryNamedTable)
    onePostNamedTable: Promise<PostNamedTable>;

    @OneToOne(type => PostNamedColumn, post => post.oneCategoryNamedColumn)
    onePostNamedColumn: Promise<PostNamedColumn>;

    @OneToOne(type => PostNamedAll, post => post.oneCategoryNamedAll)
    onePostNamedAll: Promise<PostNamedAll>;

}

@Entity("s_category", {
    orderBy: {
        id: "ASC",
    }
})
export class CategoryNamedTable {

    @PrimaryColumn("int")
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.oneCategory)
    onePost: Promise<Post>;

    @ManyToMany(type => Post, post => post.twoSideCategories)
    twoSidePosts: Promise<Post[]>;

    @OneToMany(type => Post, post => post.twoSideCategory)
    twoSidePosts2: Promise<Post[]>;

    // ManyToMany with named properties
    @ManyToMany(type => PostNamedTable, post => post.categoriesNamedTable)
    postsNamedTable: Promise<PostNamedTable[]>;

    @ManyToMany(type => PostNamedColumn, post => post.categoriesNamedColumn)
    postsNamedColumn: Promise<PostNamedColumn[]>;

    @ManyToMany(type => PostNamedAll, post => post.categoriesNamedAll)
    postsNamedAll: Promise<PostNamedAll[]>;

    // OneToMany with named properties
    @OneToMany(type => PostNamedTable, post => post.categoryNamedTable)
    onePostsNamedTable: Promise<PostNamedTable[]>;

    @OneToMany(type => PostNamedColumn, post => post.categoryNamedColumn)
    onePostsNamedColumn: Promise<PostNamedColumn[]>;

    @OneToMany(type => PostNamedAll, post => post.categoryNamedAll)
    onePostsNamedAll: Promise<PostNamedAll[]>;

    // OneToOne with named properties
    @OneToOne(type => PostNamedTable, post => post.oneCategoryNamedTable)
    onePostNamedTable: Promise<PostNamedTable>;

    @OneToOne(type => PostNamedColumn, post => post.oneCategoryNamedColumn)
    onePostNamedColumn: Promise<PostNamedColumn>;

    @OneToOne(type => PostNamedAll, post => post.oneCategoryNamedAll)
    onePostNamedAll: Promise<PostNamedAll>;
}

@Entity()
export class CategoryNamedColumn {

    @PrimaryColumn("int", {
        name: "s_category_id",
    })
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.oneCategory)
    onePost: Promise<Post>;

    @ManyToMany(type => Post, post => post.twoSideCategories)
    twoSidePosts: Promise<Post[]>;

    @OneToMany(type => Post, post => post.twoSideCategory)
    twoSidePosts2: Promise<Post[]>;

    // ManyToMany with named properties
    @ManyToMany(type => PostNamedTable, post => post.categoriesNamedTable)
    postsNamedTable: Promise<PostNamedTable[]>;

    @ManyToMany(type => PostNamedColumn, post => post.categoriesNamedColumn)
    postsNamedColumn: Promise<PostNamedColumn[]>;

    @ManyToMany(type => PostNamedAll, post => post.categoriesNamedAll)
    postsNamedAll: Promise<PostNamedAll[]>;

    // OneToMany with named properties
    @OneToMany(type => PostNamedTable, post => post.categoryNamedTable)
    onePostsNamedTable: Promise<PostNamedTable[]>;

    @OneToMany(type => PostNamedColumn, post => post.categoryNamedColumn)
    onePostsNamedColumn: Promise<PostNamedColumn[]>;

    @OneToMany(type => PostNamedAll, post => post.categoryNamedAll)
    onePostsNamedAll: Promise<PostNamedAll[]>;

    // OneToOne with named properties
    @OneToOne(type => PostNamedTable, post => post.oneCategoryNamedTable)
    onePostNamedTable: Promise<PostNamedTable>;

    @OneToOne(type => PostNamedColumn, post => post.oneCategoryNamedColumn)
    onePostNamedColumn: Promise<PostNamedColumn>;

    @OneToOne(type => PostNamedAll, post => post.oneCategoryNamedAll)
    onePostNamedAll: Promise<PostNamedAll>;
}

@Entity("s_category_named_all", {
    orderBy: {
        id: "ASC",
    }
})
export class CategoryNamedAll {

    @PrimaryColumn("int", {
        name: "s_category_id",
    })
    id: number;

    @Column()
    name: string;

    @OneToOne(type => Post, post => post.oneCategory)
    onePost: Promise<Post>;

    @ManyToMany(type => Post, post => post.twoSideCategories)
    twoSidePosts: Promise<Post[]>;

    @OneToMany(type => Post, post => post.twoSideCategory)
    twoSidePosts2: Promise<Post[]>;

    // ManyToMany with named properties
    @ManyToMany(type => PostNamedTable, post => post.categoriesNamedTable)
    postsNamedTable: Promise<PostNamedTable[]>;

    @ManyToMany(type => PostNamedColumn, post => post.categoriesNamedColumn)
    postsNamedColumn: Promise<PostNamedColumn[]>;

    @ManyToMany(type => PostNamedAll, post => post.categoriesNamedAll)
    postsNamedAll: Promise<PostNamedAll[]>;

    // OneToMany with named properties
    @OneToMany(type => PostNamedTable, post => post.categoryNamedTable)
    onePostsNamedTable: Promise<PostNamedTable[]>;

    @OneToMany(type => PostNamedColumn, post => post.categoryNamedColumn)
    onePostsNamedColumn: Promise<PostNamedColumn[]>;

    @OneToMany(type => PostNamedAll, post => post.categoryNamedAll)
    onePostsNamedAll: Promise<PostNamedAll[]>;

    // OneToOne with named properties
    @OneToOne(type => PostNamedTable, post => post.oneCategoryNamedTable)
    onePostNamedTable: Promise<PostNamedTable>;

    @OneToOne(type => PostNamedColumn, post => post.oneCategoryNamedColumn)
    onePostNamedColumn: Promise<PostNamedColumn>;

    @OneToOne(type => PostNamedAll, post => post.oneCategoryNamedAll)
    onePostNamedAll: Promise<PostNamedAll>;
}