import {Table} from "../../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Category} from "./Category";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import {Details} from "./Details";
import {Photo} from "./Photo";

@Table()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => Category, category => category.post, {
        nullable: true
    })
    @JoinColumn()
    category: Category;

    @OneToOne(type => Details, details => details.post, {
        nullable: false
    })
    @JoinColumn()
    details: Details;

    @OneToOne(type => Photo, photo => photo.post)
    photo: Photo;

}