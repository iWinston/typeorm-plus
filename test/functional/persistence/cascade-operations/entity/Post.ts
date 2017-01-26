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

    @ManyToOne(type => Category, category => category.posts, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    category: Category|null;

    @ManyToMany(type => Photo, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    @JoinTable()
    photos: Photo[];

    @OneToOne(type => Category, category => category.onePost, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    oneCategory: Category;

}