import {DocumentSchema} from "../../schema/DocumentSchema";

/**
 * Represents single remove operation. Remove operation is used to keep in memory what document with what id
 * should be removed in some future.
 */
export interface RemoveOperation {
    schema: DocumentSchema;
    id: string;
}