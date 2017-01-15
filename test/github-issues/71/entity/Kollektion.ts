import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity("kollektion")
export class Kollektion {

    @PrimaryColumn("int", { generated: true, name: "kollektion_id" })
    id: number;

    @Column({ name: "kollektion_name" })
    name: string;

}