import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 */
export class UpdateOperation {
    constructor(public target: Function|string,
                public entity: any,
                public entityId: ObjectLiteral,
                public columns: ColumnMetadata[],
                public relations: RelationMetadata[],
                public date = new Date()) {
    }
}