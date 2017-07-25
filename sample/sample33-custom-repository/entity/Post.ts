import {Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "../../../src/index";
import {Author} from "./Author";

@Entity()
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