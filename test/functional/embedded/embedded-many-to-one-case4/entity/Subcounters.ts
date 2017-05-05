import {EmbeddableEntity} from "../../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../../src/decorator/columns/Column";

@EmbeddableEntity()
export class Subcounters {

    @Column()
    version: number;

    @Column()
    watches: number;

}