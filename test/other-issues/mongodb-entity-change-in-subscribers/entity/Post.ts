import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {UpdateDateColumn} from "../../../../src/decorator/columns/UpdateDateColumn";
import {ObjectIdColumn} from "../../../../src";

@Entity()
export class Post {

    @ObjectIdColumn()
    id: number;

    @Column()
    title: string;

    @Column()
    active: boolean = false;

    @UpdateDateColumn()
    updateDate: Date;

    updatedColumns: number = 0;

    loaded: boolean = false;
}
