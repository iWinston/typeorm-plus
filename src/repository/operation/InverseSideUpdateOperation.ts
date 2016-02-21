import {DocumentSchema} from "../../schema/DocumentSchema";
import {RelationSchema} from "../../schema/RelationSchema";

/**
 * Represents single inverse side update operation.
 */
export interface InverseSideUpdateOperation {
    documentSchema: DocumentSchema;
    getDocumentId: () => any;
    inverseSideDocumentId: any;
    inverseSideDocumentSchema: DocumentSchema;
    inverseSideDocumentRelation: RelationSchema;
}