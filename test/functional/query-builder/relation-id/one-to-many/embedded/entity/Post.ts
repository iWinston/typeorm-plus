import {Entity} from "../../../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Embedded} from "../../../../../../../src/decorator/Embedded";
import {Counters} from "./Counters";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Embedded(() => Counters)
    counters: Counters;

}