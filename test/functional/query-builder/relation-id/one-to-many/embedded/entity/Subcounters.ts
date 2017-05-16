import {Column} from "../../../../../../../src/decorator/columns/Column";
import {OneToMany} from "../../../../../../../src/decorator/relations/OneToMany";
import {User} from "./User";

export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

    @OneToMany(type => User, user => user.posts)
    watchedUsers: User[];

    watchedUserIds: number[];

}