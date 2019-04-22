import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src";
import { lowercase } from "./User";

@Entity()
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({transformer: [lowercase]})
    email: string;
}