import {PrimaryColumn, Column} from "../../../src/columns";
import {Table} from "../../../src/tables";
import {OneToOne} from "../../../src/relations";
import {Image} from "./Image";

@Table("sample10_image_details")
export class ImageDetails {

    @PrimaryColumn("int", { generated: true })
    id: number;

    @Column()
    meta: string;

    @Column()
    comment: string;

    @OneToOne(type => Image, image => image.details)
    image: Image;

}