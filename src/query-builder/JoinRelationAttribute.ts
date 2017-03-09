import {RelationMetadata} from "../metadata/RelationMetadata";
import {Selection} from "./alias/Selection";

export interface JoinRelationAttribute {

    type: "LEFT"|"INNER";
    mapToProperty: string;
    relationOwnerSelection: Selection;
    relation: RelationMetadata;
    junctionSelection: Selection;
    joinInverseSideSelection?: Selection;
    joinInverseSideCondition?: string;
}