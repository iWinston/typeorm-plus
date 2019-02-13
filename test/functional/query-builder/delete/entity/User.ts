import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryColumn} from "../../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../src/decorator/entity/Entity";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

}
