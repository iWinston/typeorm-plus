import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";

@Entity("sample23_author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}