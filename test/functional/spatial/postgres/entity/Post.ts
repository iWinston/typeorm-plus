import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Index} from "../../../../../src/decorator/Index";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("geometry", {
      nullable: true
    })
    @Index({
      spatial: true
    })
    geom: object;

    @Column("geography", {
      nullable: true
    })
    geog: object;
}
