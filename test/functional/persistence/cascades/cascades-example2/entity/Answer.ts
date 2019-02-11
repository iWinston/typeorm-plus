import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {ManyToOne} from "../../../../../../src/decorator/relations/ManyToOne";
import {Photo} from "./Photo";
import {User} from "./User";
import {Question} from "./Question";

@Entity()
export class Answer {

    @PrimaryColumn()
    id: number;

    @ManyToOne(type => Question, question => question.answers, {
        cascade: ["insert"],
        nullable: false
    })
    question: Question;

    @ManyToOne(type => Photo, {
        cascade: ["insert"],
        nullable: false
    })
    photo: Photo;

    @ManyToOne(type => User, {
        cascade: ["insert"],
        nullable: false
    })
    user: User;

}
