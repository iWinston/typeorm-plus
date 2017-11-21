import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src/index";

@Entity()
export class Animal {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}