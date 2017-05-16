import {Column} from "../../../../../../../src/decorator/columns/Column";
import {User} from "./User";
import {OneToOne} from "../../../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../../../src/decorator/relations/JoinColumn";

export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

    @OneToOne(type => User)
    @JoinColumn()
    watchedUser: User;

    watchedUserId: number;

}