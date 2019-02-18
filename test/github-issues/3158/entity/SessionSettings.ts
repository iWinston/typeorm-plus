import { Entity, OneToOne, JoinColumn } from "../../../../src";
import { Session } from "./Session";


@Entity({
    name: "SessionSettings"
})
export class SessionSettings  {

    @OneToOne(type => Session, session => session.id, { primary: true})
    @JoinColumn({ name: "id", referencedColumnName: "id"})
    session?: Session;

}
