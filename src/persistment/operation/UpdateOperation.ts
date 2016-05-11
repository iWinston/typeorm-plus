import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * @internal
 */
export class UpdateOperation {
    constructor(public entity: any,
                public entityId: any,
                public columns: ColumnMetadata[],
                public relations: RelationMetadata[],
                public date = new Date()) {
    }
}