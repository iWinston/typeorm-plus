import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {ManyToMany} from "../../../../../../src/decorator/relations/ManyToMany";
import {Photo} from "./Photo";
import {OneToMany} from "../../../../../../src/decorator/relations/OneToMany";
import {JoinTable} from "../../../../../../src/decorator/relations/JoinTable";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class User { // todo: check one-to-one relation as well, but in another model or test

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Photo, photo => photo.user, { cascade: true })
    manyPhotos: Photo[];

    @ManyToMany(type => Photo, { cascade: true })
    @JoinTable()
    manyToManyPhotos: Photo[];

}