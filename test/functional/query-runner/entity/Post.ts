import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {Unique} from "../../../../src/decorator/Unique";

@Entity()
@Unique(["name", "text"])
export class Post {

    @Column({ primary: true, unique: true })
    id: number;

    @Column({ default: "My post" })
    name: string;

    @Column()
    text: string;

}