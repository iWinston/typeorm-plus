import {Column} from "../../../../src/decorator/columns/Column";
import {Document} from "./Document";
import {ClassTableChild} from "../../../../src/decorator/tables/ClassTableChild";

@ClassTableChild()
export class DeliveryNote extends Document {

    @Column()
    invoice: string = "";

}