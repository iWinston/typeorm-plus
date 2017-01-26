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

    @OneToOne(type => Post, post => post.oneCategory, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    @JoinColumn()
    onePost: Post;

    @OneToMany(type => Post, post => post.category, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    posts: Post[];

    @ManyToMany(type => Photo, photo => photo.categories, {
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