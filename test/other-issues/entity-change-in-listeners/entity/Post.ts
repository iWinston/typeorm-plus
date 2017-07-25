import {Entity} from "../../../../src/decorator/entity/Entity";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {Column} from "../../../../src/decorator/columns/Column";
import {BeforeUpdate} from "../../../../src/decorator/listeners/BeforeUpdate";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ default: false })
    active: boolean;

    @BeforeUpdate()
    beforeUpdate() {
        this.title += "!";
    }

}