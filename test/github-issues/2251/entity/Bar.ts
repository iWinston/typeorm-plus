import { Column, PrimaryGeneratedColumn } from "../../../../src";
import { Entity } from "../../../../src/decorator/entity/Entity";

@Entity()
export class Bar {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;
}
