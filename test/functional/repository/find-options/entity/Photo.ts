import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/index";
import {Column} from "../../../../../src/decorator/columns/Column";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 500
    })
    name: string;

    @Column("text")
    description: string;

    @Column()
    filename: string;

    @Column("int")
    views: number;

    @Column()
    isPublished: boolean;

}