import {Category} from "./Category";
import {ManyToMany} from "../../../../../src/decorator/relations/ManyToMany";
import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Tag} from "./Tag";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {JoinTable} from "../../../../../src/decorator/relations/JoinTable";

@Entity()
export class PostWithoutDecorators {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Tag)
    tag: Tag;
    
    tagId: number;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];
    
    categoryIds: number[];

}