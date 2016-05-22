import {EntityMetadata} from "../../metadata/EntityMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * @internal
 */
export class MissingJoinTableError extends Error {
    name = "MissingJoinTableError";

    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata) {
        super();

        if (relation.hasInverseSide) {
            this.message = `JoinTable is missing on both sides of ${entityMetadata.name}#${relation.name} and ` + 
                `${relation.inverseEntityMetadata.name}#${relation.inverseRelation.name} many-to-many relationship. ` + 
                `You need to put decorator decorator on one of the sides.`;
        } else {
            this.message = `JoinTable is missing on ${entityMetadata.name}#${relation.name} many-to-many relationship. ` + 
                `You need to put JoinTable decorator on it.`;
        }
    }

}