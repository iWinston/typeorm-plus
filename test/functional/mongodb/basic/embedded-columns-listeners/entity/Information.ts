import {Column} from "../../../../../../src/decorator/columns/Column";
import {AfterLoad} from "../../../../../../src";

export class Information {

    @Column()
    description?: string;

    @AfterLoad()
    afterLoad() {
        this.description = "description afterLoad";
    }

}