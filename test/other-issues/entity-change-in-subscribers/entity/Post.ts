import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {UpdateDateColumn} from "../../../../src/decorator/columns/UpdateDateColumn";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {PostCategory} from "./PostCategory";
import {JoinTable} from "../../../../src/decorator/relations/JoinTable";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({default: false})
    active: boolean;

    @UpdateDateColumn()
    updateDate: Date;

    @OneToOne(type => PostCategory, category => category.post)
    @JoinTable()
    category: PostCategory;

    updatedColumns: string[] = [];
    updatedRelations: string[] = [];
}