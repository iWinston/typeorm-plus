import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Table("view", {skipSchemaSync: true})
export class View {

    @PrimaryColumn()
    id: number;

    @Column()
    title: string;

}