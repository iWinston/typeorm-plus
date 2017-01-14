import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";
import {Photo} from "./Photo";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category, category => category.oneToManyPosts, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true,
    })
    manyToOneCategory: Category;

    @ManyToOne(type => Category, category => category.noCascadeOneToManyPosts, {
        cascadeInsert: false,
        cascadeUpdate: false,
        cascadeRemove: false,
    })
    noCascadeManyToOneCategory: Category;

    @OneToOne(type => Category, category => category.oneToOneOwnerPost, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true,
    })
    oneToOneCategory: Category;

    @OneToOne(type => Category, category => category.noCascadeOneToOnePost, {
        cascadeInsert: false,
        cascadeUpdate: false,
        cascadeRemove: false,
    })
    noCascadeOneToOneCategory: Category;

    @ManyToMany(type => Category, category => category.manyToManyPosts, {
        cascadeInsert: true,
        cascadeUpdate: true,
    })
    @JoinTable()
    manyToManyOwnerCategories: Category[];

    @ManyToMany(type => Category, category => category.noCascadeManyToManyPosts, {
        cascadeInsert: false,
        cascadeUpdate: false,
    })
    @JoinTable()
    noCascadeManyToManyOwnerCategories: Category[];

    @ManyToMany(type => Photo, photo => photo.posts, {
        cascadeInsert: true,
        cascadeUpdate: true,
    })
    @JoinTable()
    photos: Photo[];

    @ManyToMany(type => Photo, {
        cascadeInsert: true,
        cascadeUpdate: true,
    })
    @JoinTable()
    noInversePhotos: Photo[];

}