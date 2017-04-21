import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {ManyToOne} from "../../../../../src/decorator/relations/ManyToOne";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @ManyToOne(type => Category)
    // @JoinColumn([
    //     { name: "category_type", referencedColumnName: "type" },
    //     { name: "category_name", referencedColumnName: "name" }
    // ])
    category: Category;

    // todo: test relation with multiple + empty join column one-to-one
    // todo: test relation with multiple + empty join column many-to-one
    // todo: test relation with multiple + single join column
    // todo: test relation with multiple + multiple join columns

}