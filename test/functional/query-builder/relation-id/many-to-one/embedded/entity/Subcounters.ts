import {Column} from "../../../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../../../src/decorator/relations/ManyToOne";
import {User} from "./User";

export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

    @ManyToOne(type => User)
    watchedUser: User;

    watchedUserId: number;

}