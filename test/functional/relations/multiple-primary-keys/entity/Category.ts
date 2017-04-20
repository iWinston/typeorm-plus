import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";

@Entity()
export class Category {

    @PrimaryColumn()
    name: string;

    @PrimaryColumn()
    type: string;

}