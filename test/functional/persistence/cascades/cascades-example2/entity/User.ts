import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {Question} from "./Question";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @ManyToOne(type => Question, {
        cascade: ["insert"],
        nullable: true
    })
    question: Question;

}
