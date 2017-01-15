import {Column} from "../../../../../src/decorator/columns/Column";
import {EmbeddableEntity} from "../../../../../src/decorator/entity/EmbeddableEntity";

@EmbeddableEntity()
export class Counters {

    @Column()
    likes: number;

    @Column()
    comments: number;

    @Column()
    favorites: number;

}