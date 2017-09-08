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

    @Column()
    @Index()
    email: string;

    @Column()
    @Index()
    username: string;

    @Column()
    @Index()
    privilege: number;

    @CreateDateColumn()
    createdAt: string;

    @UpdateDateColumn()
    updatedAt: string;

}