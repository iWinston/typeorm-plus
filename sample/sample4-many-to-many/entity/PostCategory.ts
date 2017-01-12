import {PrimaryGeneratedColumn, Column, Entity} from "../../../src/index";

@Entity("sample4_post_category")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}