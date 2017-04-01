import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";
import {Guest} from "./Guest";

@Entity()
export class Comment {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    context: string;

    @ManyToOne(type => Guest, guest => guest.comments)
    author: Guest;
}