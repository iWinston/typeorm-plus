import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "../entity/Post";
import {Category} from "../entity/Category";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @ManyToOne(type => Post, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true,
        nullable: false
    })
    post: Post|null;

    @ManyToMany(type => Category, category => category.photos, {
        cascadeInsert: true,
        cascadeUpdate: true
    })
    categories: Category[];

}