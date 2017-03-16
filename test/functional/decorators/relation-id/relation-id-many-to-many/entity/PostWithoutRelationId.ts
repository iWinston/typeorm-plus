import {ManyToMany} from "../../../../../../src/decorator/relations/ManyToMany";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../../src/decorator/columns/Column";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";
import {JoinTable} from "../../../../../../src/decorator/relations/JoinTable";
import {CategoryWithoutRelationId} from "./CategoryWithoutRelationId";
import {Tag} from "./Tag";

@Entity()
export class PostWithoutRelationId {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;
    
    @ManyToOne(type => Tag)
    tag: Tag;
    
    tagId: number;

    @ManyToMany(type => CategoryWithoutRelationId, category => category.posts)
    @JoinTable({
        name: "post_without_relation_id_categories",
        joinColumn: {
            name: "post_id"
        },
        inverseJoinColumn: {
            name: "category_id"
        }
    })
    categories: CategoryWithoutRelationId[];

    @ManyToMany(type => CategoryWithoutRelationId)
    @JoinTable({
        name: "post_without_relation_id_subcategories",
        joinColumn: {
            name: "post_id"
        },
        inverseJoinColumn: {
            name: "category_id"
        }
    })
    subcategories: CategoryWithoutRelationId[];
    
    categoryIds: number[];

}