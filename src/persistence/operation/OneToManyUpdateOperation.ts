import {EntityMetadata} from "../../metadata/EntityMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";

export interface OneToManyUpdateOperation {

    metadata: EntityMetadata;
    updateValues: ObjectLiteral;
    condition: ObjectLiteral;

}