import {Entity} from "../../../../../src/decorator/entity/Entity";
import {Column} from "../../../../../src/decorator/columns/Column";
import {ValueTransformer} from "../../../../../src/decorator/options/ValueTransformer";
import {PrimaryGeneratedColumn} from "../../../../../src/decorator/columns/PrimaryGeneratedColumn";

class TagTransformer implements ValueTransformer<string[], string> {

    transformTo (value: string[]): string {
        return value.join(", ");
    }

    transformFrom (value: string): string[] {
        return value.split(", ");
    }

}

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ type: String, transformer: new TagTransformer() })
    tags: string[];

}
