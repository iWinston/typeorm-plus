import {RelationMetadata} from "../../metadata/RelationMetadata";
import {EntityMetadata} from "../../metadata/EntityMetadata";
import {ObjectLiteral} from "../../common/ObjectLiteral";

/**
 */
export class RemoveOperation {
    constructor(public target: Function|string, // todo: probably should be metadata here
                public entity: any,
                public entityId: ObjectLiteral,
                public fromMetadata: EntityMetadata, // todo: use relation.metadata instead?
                public relation: RelationMetadata|undefined,
                public fromEntityId: ObjectLiteral|undefined) {
    }
}