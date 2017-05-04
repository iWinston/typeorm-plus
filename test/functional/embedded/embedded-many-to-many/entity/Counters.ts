import {EmbeddableEntity} from "../../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Embedded} from "../../../../../src/decorator/Embedded";
import {Subcounters} from "./Subcounters";
import {User} from "./User";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";

@EmbeddableEntity()
export class Counters {

    @Column()
    code: number;

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

    @Embedded(() => Subcounters)
    subcounters: Subcounters;

    @ManyToMany(type => User)
    @JoinTable()
    likedUsers: User[];

}