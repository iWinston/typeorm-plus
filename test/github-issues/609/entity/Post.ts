import {CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn} from "../../../../src";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn()
    createDate: Date;

    @UpdateDateColumn({ precision: undefined, default: () => "CURRENT_TIMESTAMP" })
    updateDate: Date;

}