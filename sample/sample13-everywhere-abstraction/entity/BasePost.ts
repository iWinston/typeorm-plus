import {PrimaryGeneratedColumn, Column} from "../../../src/index";
import {AbstractEntity} from "../../../src/decorator/entity/AbstractEntity";

@AbstractEntity()
export class BasePost {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    title2312312: string;

}