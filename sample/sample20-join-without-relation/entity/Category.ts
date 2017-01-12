import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";

@Entity("sample20_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}