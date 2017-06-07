import {Entity} from "../../../../src/decorator/entity/Entity";
import {EntityModel} from "../../../../src/repository/EntityModel";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";

@Entity()
export class Post extends EntityModel {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    text: string;

}