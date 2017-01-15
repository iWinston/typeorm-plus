import {Column} from "../../../../src/decorator/columns/Column";
import {Document} from "./Document";
import {ClassEntityChild} from "../../../../src/decorator/entity/ClassEntityChild";

@ClassEntityChild()
export class DeliveryNote extends Document {

    @Column()
    invoice: string = "";

}