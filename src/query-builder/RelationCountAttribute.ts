import {Selection} from "./alias/Selection";
import {EntityMetadata} from "../metadata/EntityMetadata";

export interface RelationCountAttribute {

    relationOwnerSelection: Selection;
    relationPropertyName: string;
    selection: Selection;
    // property: string;
    condition?: string;
    mapToProperty?: string;
    entities: { entity: any, metadata: EntityMetadata }[];
    // entity?: any;
}
