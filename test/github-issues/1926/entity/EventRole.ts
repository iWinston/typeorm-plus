import {Column, Entity, ManyToOne, PrimaryColumn} from "../../../../src/index";
import {Event} from "./Event";
import { Role } from "./Role";

@Entity()
export class EventRole {
    @PrimaryColumn("uuid")
    eventId: string;

    @PrimaryColumn("uuid")
    roleId: string;

    @Column()
    description: string;

    @Column()
    compensation: string;

    @ManyToOne(type => Role, role => role.id, {
        onDelete: "CASCADE",
    })
    role: Role;

    @ManyToOne(type => Event, event => event.roles, {
        onDelete: "CASCADE",
    })
    event: Event;
}