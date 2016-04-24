import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToOneInverse} from "../../../src/relations";
import {Image} from "./Image";

@Table("sample10_image_details")
export class ImageDetails {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    meta: string;

    @Column()
    comment: string;

    @OneToOneInverse(type => Image, image => image.details)
    image: Image;

}