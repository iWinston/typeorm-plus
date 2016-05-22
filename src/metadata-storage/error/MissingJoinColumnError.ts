import {EntityMetadata} from "../../metadata/EntityMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * @internal
 */
export class MissingJoinColumnError extends Error {
    name = "MissingJoinColumnError";

    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata) {
        super();
        if (relation.hasInverseSide) {
            this.message = `JoinColumn is missing on both sides of ${entityMetadata.name}#${relation.name} and ` +
                `${relation.inverseEntityMetadata.name}#${relation.inverseRelation.name} one-to-one relationship. ` + 
                `You need to put JoinColumn decorator on one of the sides.`;
        } else {
            this.message = `JoinColumn is missing on ${entityMetadata.name}#${relation.name} one-to-one relationship. ` + 
                `You need to put JoinColumn decorator on it.`;
        }
    }

}