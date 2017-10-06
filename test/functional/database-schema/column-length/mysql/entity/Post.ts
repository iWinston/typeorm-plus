import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryColumn()
    id: number;

    @Column("int", {
        length: 5
    })
    int: number;

    @Column("tinyint", {
        length: 5
    })
    tinyint: number;

    @Column("smallint", {
        length: 5
    })
    smallint: number;

    @Column("mediumint", {
        length: 5
    })
    mediumint: number;

    @Column("bigint", {
        length: 5
    })
    bigint: number;

    @Column("char", {
        length: 50
    })
    char: string;

    @Column("varchar", {
        length: 50
    })
    varchar: string;

}