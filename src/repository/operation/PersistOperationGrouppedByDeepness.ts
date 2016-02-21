import {DocumentSchema} from "../../schema/DocumentSchema";
import {PersistOperation} from "./PersistOperation";

/**
 * Represents single remove operation. Remove operation is used to keep in memory what document with what id
 * should be removed in some future.
 */
export interface PersistOperationGrouppedByDeepness {
    deepness: number;
    operations: PersistOperation[];
}