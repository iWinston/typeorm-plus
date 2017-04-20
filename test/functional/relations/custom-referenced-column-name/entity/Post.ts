import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import {Category} from "./Category";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {Tag} from "./Tag";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    categoryName: string;

    @Column({ nullable: true })
    tagName: string;

    @ManyToOne(type => Category)
    @JoinColumn({ name: "categoryName", referencedColumnName: "name" })
    category: Category;

    @OneToOne(type => Tag)
    @JoinColumn({ name: "tagName", referencedColumnName: "name" })
    tag: Tag;

}