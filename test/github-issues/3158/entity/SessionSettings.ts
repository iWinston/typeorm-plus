import { Entity, OneToOne, JoinColumn, PrimaryColumn } from "../../../../src";
import { Session } from "./Session";

@Entity({
    name: "SessionSettings"
})
export class SessionSettings  {

    @PrimaryColumn()
    id: number;

    @OneToOne(type => Session, session => session.id)
    @JoinColumn({ name: "id", referencedColumnName: "id"})
    session?: Session;

}
