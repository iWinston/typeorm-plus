import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {FruitEnum} from "../enum/FruitEnum";

@Entity()
export class Post {

    // -------------------------------------------------------------------------
    // Numeric Types
    // -------------------------------------------------------------------------

    @PrimaryColumn()
    id: number;

    @Column("int")
    int: number;

    @Column("tinyint")
    tinyint: number;

    @Column("smallint")
    smallint: number;

    @Column("mediumint")
    mediumint: number;

    @Column("bigint")
    bigint: string;

    @Column("float")
    float: number;

    @Column("double")
    double: number;

    @Column("decimal")
    decimal: string;

    // -------------------------------------------------------------------------
    // String Types
    // -------------------------------------------------------------------------

    @Column("char")
    char: string;

    @Column("varchar")
    varchar: string;

    @Column("text")
    text: string;

    @Column("tinytext")
    tinytext: string;

    @Column("mediumtext")
    mediumtext: string;

    @Column("longtext")
    longtext: string;

    // -------------------------------------------------------------------------
    // Binary Types
    // -------------------------------------------------------------------------
    @Column("binary")
    binary: Buffer;

    @Column("varbinary")
    varbinary: Buffer;

    // -------------------------------------------------------------------------
    // LOB Types
    // -------------------------------------------------------------------------

    @Column("blob")
    blob: Buffer;

    @Column("tinyblob")
    tinyblob: Buffer;

    @Column("mediumblob")
    mediumblob: Buffer;

    @Column("longblob")
    longblob: Buffer;

    // -------------------------------------------------------------------------
    // Date Types
    // -------------------------------------------------------------------------

    @Column("date")
    date: string;

    @Column("datetime")
    datetime: Date;

    @Column("timestamp")
    timestamp: Date;

    @Column("time")
    time: string;

    @Column("year")
    year: number;

    // -------------------------------------------------------------------------
    // Spatial Types
    // -------------------------------------------------------------------------

    @Column("geometry")
    geometry: string;

    @Column("point")
    point: string;

    @Column("linestring")
    linestring: string;

    @Column("polygon")
    polygon: string;

    @Column("multipoint")
    multipoint: string;

    @Column("multilinestring")
    multilinestring: string;

    @Column("multipolygon")
    multipolygon: string;

    @Column("geometrycollection")
    geometrycollection: string;

    // -------------------------------------------------------------------------
    // Other Types
    // -------------------------------------------------------------------------

    @Column("enum", { enum: ["A", "B", "C"] })
    enum: string;

    @Column("enum", { enum: FruitEnum })
    classEnum1: FruitEnum;

    @Column("json")
    json: Object;

    @Column("simple-array")
    simpleArray: string[];

    @Column("simple-json")
    simpleJson: { param: string };
}