import {EmbeddableEntity} from "../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../src/decorator/relations/ManyToMany";
import {JoinTable} from "../../../../src/decorator/relations/JoinTable";
import {User} from "./User";

@EmbeddableEntity()
export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

    @ManyToMany(type => User)
    @JoinTable()
    watchedUsers: User[];

}