import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Equal} from "../../../../../src/find-options/operator/Equal";
import {OneToOne} from "../../../../../src/decorator/relations/OneToOne";
import {JoinColumn} from "../../../../../src/decorator/relations/JoinColumn";
import {CategoryWithRelation} from "./CategoryWithRelation";

@Entity()
export class PostWithRelation {

    static scope = {
        default: {
            title: Equal("title#2")
        },
        title3: {
            title: "title#3"
        }
    };

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @OneToOne(type => CategoryWithRelation, category => category.post, { eager: true })
    @JoinColumn()
    category: CategoryWithRelation;

}
