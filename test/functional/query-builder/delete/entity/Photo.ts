import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Counters} from "./Counters";

@Entity()
export class Photo {

    @PrimaryColumn()
    id: number;

    @Column()
    url: string;

    @Column(type => Counters)
    counters: Counters;

}
