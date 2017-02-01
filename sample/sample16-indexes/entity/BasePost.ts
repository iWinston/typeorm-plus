import {PrimaryGeneratedColumn, Column} from "../../../src/index";
import {Index} from "../../../src/decorator/Index";
import {AbstractEntity} from "../../../src/decorator/entity/AbstractEntity";

@AbstractEntity()
@Index("my_index_with_id_and_text", ["id", "text"])
export class BasePost {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    text: string;

    @Index()
    @Column()
    extra: string;

}