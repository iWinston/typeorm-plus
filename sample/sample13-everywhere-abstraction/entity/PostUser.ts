import {PrimaryColumn, Column, Table} from "../../../src/index";

@Table("sample13_post_user")
export class PostUser {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column("int")
    name: string;

    @Column()
    firstName: string;

    @Column()
    secondName: string;

}