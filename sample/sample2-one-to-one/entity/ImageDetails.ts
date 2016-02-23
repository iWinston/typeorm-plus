import {PrimaryColumn, Column} from "../../../src/decorator/Columns";
import {Table} from "../../../src/decorator/Tables";
import {OneToOne} from "../../../src/decorator/Relations";
import {Image} from "./Image";

@Table("sample2_image_details")
export class ImageDetails {

    @PrimaryColumn("int", { autoIncrement: true })
    id: number;

    @Column()
    meta: string;

    @Column()
    comment: string;

    @OneToOne<Image>(false, () => Image, image => image.details)
    image: Image;

}