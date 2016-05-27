import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {Counters} from "./Counters";
import {Embedded} from "../../../src/decorator/Embedded";

@Table("sample26_post")
export class Post {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;
    
    @Embedded(type => Counters)
    counters: Counters;

}