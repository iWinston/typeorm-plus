import {PrimaryGeneratedColumn, Column, Table, ManyToOne} from "../../../src/index";
import {Author} from "./Author";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Author, {
        cascadeInsert: true
    })
    author: Author;

}