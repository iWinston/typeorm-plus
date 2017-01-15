import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";

@Entity("sample19_category")
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}