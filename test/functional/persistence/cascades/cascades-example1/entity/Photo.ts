import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../../src/decorator/entity/Entity";

@Entity()
export class Photo {

    @PrimaryColumn()
    id: number;

}
