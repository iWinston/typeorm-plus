import {EmbeddableEntity} from "../../../../../src/decorator/entity/EmbeddableEntity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";

@EmbeddableEntity()
export class Subcounters {

    @PrimaryColumn()
    version: number;

    @Column()
    watches: number;

}