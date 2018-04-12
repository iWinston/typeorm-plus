import {Column, Entity, ManyToOne, PrimaryGeneratedColumn, Index} from "../../../../src/index";
import {Event} from "./Event";
import { Role } from "./Role";

@Entity()
@Index(["eventId", "roleId"], { unique: true })
export class EventRole {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    // @PrimaryColumn("uuid")
    @Column("uuid")
    eventId: string;

    // @PrimaryColumn("uuid")
    @Column("uuid")
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