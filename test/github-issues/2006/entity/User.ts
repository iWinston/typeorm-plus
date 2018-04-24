import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { nullable: true })
    token: string | null = null;

}