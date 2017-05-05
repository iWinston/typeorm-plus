import {Column} from "../../../../src/decorator/columns/Column";

export class Duration {

    @Column({ nullable: true })
    minutes: number;

    @Column({ nullable: true })
    hours: number;

    @Column({ nullable: true })
    days: number;

}