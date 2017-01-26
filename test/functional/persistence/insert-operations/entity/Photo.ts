import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Post} from "../entity/Post";
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

    @ManyToMany(type => Post, photo => photo.photos, {
        cascadeInsert: true,
        cascadeUpdate: true,
    })
    posts: Post[];

}