import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryColumn} from "../../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../src/decorator/relations/ManyToOne";
import {Kollektion} from "./Kollektion";
import {JoinColumn} from "../../../../src/decorator/relations/JoinColumn";

@Table("artikel")
export class Artikel {

    @PrimaryColumn("int", { generated: true, name: "artikel_id" })
    id: number;

    @Column({ name: "artikel_nummer" })
    nummer: string;

    @Column({ name: "artikel_name" })
    name: string;

    @Column({ name: "artikel_extrabarcode" })
    extrabarcode: string;

    @Column({ name: "artikel_saison" })
    saison: string;

    @ManyToOne(type => Kollektion, { cascadeAll: true })
    @JoinColumn({ name: "id_kollektion" })
    kollektion: Kollektion;

}