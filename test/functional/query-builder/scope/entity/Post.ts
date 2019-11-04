import {Entity} from "../../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../../src/decorator/columns/Column";
import {Equal} from "../../../../../src/find-options/operator/Equal";

@Entity()
export class Post {

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

}
