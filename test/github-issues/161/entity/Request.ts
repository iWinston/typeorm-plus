import {Table} from "../../../../src/decorator/tables/Table";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {OneToOne} from "../../../../src/decorator/relations/OneToOne";
import {Ticket} from "./Ticket";
import {Column} from "../../../../src/decorator/columns/Column";

@Table()
export class Request {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    owner: string;

    @OneToOne(type => Ticket, ticket => ticket.request, {
        cascadeInsert: true,
        cascadeUpdate: true,
        cascadeRemove: true
    })
    ticket: Ticket;

}