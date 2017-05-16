import {Column} from "../../../../../../../src/decorator/columns/Column";
import {ManyToMany} from "../../../../../../../src/decorator/relations/ManyToMany";
import {User} from "./User";
import {JoinTable} from "../../../../../../../src/decorator/relations/JoinTable";

export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

    @ManyToMany(type => User)
    @JoinTable()
    watchedUsers: User[];

    watchedUserIds: number[];

}