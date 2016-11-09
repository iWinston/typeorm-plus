import {Table} from "../../../../../src/decorator/tables/Table";
import {Index} from "../../../../../src/decorator/Index";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";

@Table()
@Index("index_name_english", ["nameEnglish"], { unique: true })
export class Customer {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    nameHebrew: string;

    @Column()
    nameEnglish: string;

}