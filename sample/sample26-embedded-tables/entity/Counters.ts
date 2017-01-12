import {Column} from "../../../src/index";
import {EmbeddableEntity} from "../../../src/decorator/entity/EmbeddableEntity";

@EmbeddableEntity()
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