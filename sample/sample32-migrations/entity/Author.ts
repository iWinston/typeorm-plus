import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";

@Entity()
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}