import {Entity} from "../../../../src/decorator/entity/Entity";
import {Index} from "../../../../src/decorator/Index";
import {Column} from "../../../../src/decorator/columns/Column";
import {CreateDateColumn} from "../../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../src/decorator/columns/UpdateDateColumn";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";
import {User} from "./User";

@Entity()
export class UserCredential {

    @OneToOne(() => User, {
        primary: true,
        cascadeAll: true,
    })
    @JoinColumn({
        name: "id",
        referencedColumnName: "id",
    })
    @Index()
    user: User;

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

    @Column()
    password: string;

    @Column()
    salt: string;

}