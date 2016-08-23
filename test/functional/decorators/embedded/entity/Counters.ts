import {Column} from "../../../../../src/decorator/columns/Column";
import {EmbeddableTable} from "../../../../../src/decorator/tables/EmbeddableTable";

@EmbeddableTable()
export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

}