import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Post} from "./Post";
import {OneToMany} from "../../../../../src/decorator/relations/OneToMany";
import {Photo} from "./Photo";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.manyToOneCategory, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    oneToManyPosts: Post[];

    @OneToMany(type => Post, post => post.noCascadeManyToOneCategory, {
        cascadeInsert: false,
        cascadeUpdate: false
    })
    noCascadeOneToManyPosts: Post[];

    @OneToOne(type => Post, post => post.oneToOneCategory, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true,
    })
    @JoinColumn()
    oneToOneOwnerPost: Post;

    @OneToOne(type => Post, post => post.noCascadeOneToOneCategory, {
        cascadeInsert: false,
        cascadeUpdate: false,
        cascadeRemove: false,
    })
    @JoinColumn()
    noCascadeOneToOnePost: Post;

    @ManyToMany(type => Post, post => post.manyToManyOwnerCategories, {
        cascadeInsert: true,
        cascadeUpdate: true,
    })
    @JoinTable()
    manyToManyPosts: Post[];

    @ManyToMany(type => Post, post => post.noCascadeManyToManyOwnerCategories, {
        cascadeInsert: false,
        cascadeUpdate: false,
    })
    @JoinTable()
    noCascadeManyToManyPosts: Post[];

    @ManyToMany(type => Photo, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    @JoinTable()
    photos: Photo[];

    @ManyToOne(type => Photo, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    photo: Photo|null;

}