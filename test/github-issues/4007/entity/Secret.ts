import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src";
import { lowercase, encrypt } from "./User";

@Entity()
export class Secret {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({transformer: [lowercase, encrypt]})
    sensitiveValue: string;
}