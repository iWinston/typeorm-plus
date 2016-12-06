import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Table("kollektion")
export class Kollektion {

    @PrimaryColumn("int", { generated: true, name: "kollektion_id" })
    id: number;

    @Column({ name: "kollektion_name" })
    name: string;

}