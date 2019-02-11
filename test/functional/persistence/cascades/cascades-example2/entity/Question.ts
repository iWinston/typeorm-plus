import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {Answer} from "./Answer";
import {OneToMany} from "../../../../../../src/decorator/relations/OneToMany";

@Entity()
export class Question {

    @PrimaryColumn()
    id: number;

    @OneToMany(type => Answer, answer => answer.question, { cascade: ["insert"] })
    answers: Answer[];

}
