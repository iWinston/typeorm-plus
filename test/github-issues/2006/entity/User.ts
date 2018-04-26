import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column("varchar", { nullable: true })
    token: string | null = null;

    @Column({
        type: "tinyint",
        // This makes token set to be null
        default: 0,
    })
    anotherBool: boolean;


}