import {EmbeddableTable} from "../../../../src/decorator/tables/EmbeddableTable";
import {Column} from "../../../../src/decorator/columns/Column";

@EmbeddableTable()
export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

}