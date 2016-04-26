import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * @internal
 */
export class UpdateOperation {
    constructor(public entity: any,
                public entityId: any,
                public columns: ColumnMetadata[]) {
    }
}