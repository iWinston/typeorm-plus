import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Index} from "../../../../src/decorator/Index";
import {Column} from "../../../../src/decorator/columns/Column";
import {CreateDateColumn} from "../../../../src/decorator/columns/CreateDateColumn";
import {UpdateDateColumn} from "../../../../src/decorator/columns/UpdateDateColumn";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    @Index()
    id: number;

    @Column("varchar", {
        unique: true,
    })
    @Index()
    email: string;

    @Column("varchar", {
        unique: true,
    })
    @Index()
    username: string;

    @Column("tinyint", {
        default: 0,
    })
    @Index()
    privilege: number;

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

}