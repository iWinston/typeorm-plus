import {Column} from "../../../../src/decorator/columns/Column";
import {EmbeddableEntity} from "../../../../src/decorator/entity/EmbeddableEntity";

@EmbeddableEntity()
export class Contact {

    @Column()
    name: string;

    @Column()
    email: string;

}