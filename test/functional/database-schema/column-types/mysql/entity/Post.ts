import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Entity()
export class Post {

    @PrimaryColumn()
    id: string;

    @Column()
    name: string;

    @Column("int")
    int: number;

    @Column("tinyint")
    tinyint: number;

    @Column("smallint")
    smallint: number;

    @Column("mediumint")
    mediumint: number;

    @Column("bigint")
    bigint: number;

    @Column("float")
    float: number;

    @Column("double")
    double: number;

    @Column("decimal")
    decimal: number;

    @Column("date")
    date: string;

    @Column("datetime")
    datetime: Date;

    @Column("timestamp")
    timestamp: number;

    @Column("time")
    time: string;

    @Column("year")
    year: number;

    @Column("char")
    char: string;

    @Column("varchar")
    varchar: string;

    @Column("blob")
    blob: string;

    @Column("text")
    text: string;

    @Column("tinyblob")
    tinyblob: string;

    @Column("tinytext")
    tinytext: string;

    @Column("mediumblob")
    mediumblob: string;

    @Column("mediumtext")
    mediumtext: string;

    @Column("longblob")
    longblob: string;

    @Column("longtext")
    longtext: string;

    @Column("enum")
    enum: string[];

}