import {Column} from "../../../src/columns";
import {EmbeddableTable} from "../../../src/decorator/tables/EmbeddableTable";

@EmbeddableTable()
export class Counters {

    @Column()
    raiting: number;

    @Column()
    stars: number;

    @Column()
    commentCount: number;

    @Column()
    metadata: string;

}