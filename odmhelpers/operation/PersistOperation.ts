import {DocumentSchema} from "../../schema/DocumentSchema";
import {InverseSideUpdateOperation} from "./InverseSideUpdateOperation";

/**
 * Persist operation.
 */
export interface PersistOperation {
    allowedPersist: boolean;
    deepness: number;
    document: any;
    dbObject: Object;
    schema: DocumentSchema;
    afterExecution?: ((document: any) => InverseSideUpdateOperation)[];
}