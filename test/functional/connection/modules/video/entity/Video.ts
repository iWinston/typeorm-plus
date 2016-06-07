import {Table} from "../../../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";

@Table()
export class Video {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    name: string;

}