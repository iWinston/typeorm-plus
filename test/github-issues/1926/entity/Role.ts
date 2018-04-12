import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src/index";

@Entity()
export class Role {

    @PrimaryGeneratedColumn("uuid") id: string;

    @Column()
    title: string;
}