import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Counters} from "./Counters";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

    @Column(type => Counters)
    counters: Counters;

    @Column({
        type: "date",
        transformer: {
            from: (value: any) => new Date(value),
            to: (value: Date) => value.toISOString(),
        }
    })
    dateAdded: Date;
}