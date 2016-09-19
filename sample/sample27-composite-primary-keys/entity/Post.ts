import {Column, Table} from "../../../src/index";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";

@Table("sample27_composite_primary_keys")
export class Post {

    @PrimaryColumn("int")
    id: number;

    @PrimaryColumn()
    type: string;

    @Column()
    text: string;

}