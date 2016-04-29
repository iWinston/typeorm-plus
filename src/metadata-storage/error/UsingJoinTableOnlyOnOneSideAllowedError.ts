import {EntityMetadata} from "../../metadata/EntityMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * @internal
 */
export class UsingJoinTableOnlyOnOneSideAllowedError extends Error {
    name = "UsingJoinTableOnlyOnOneSideAllowedError";

    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata) {
        super();
        this.message = `Using JoinTable is allowed only on one side of the many-to-many relationship. ` + 
            `Both ${entityMetadata.name}#${relation.name} and ${relation.relatedEntityMetadata.name}#${relation.inverseRelation.name} ` + 
            `has JoinTable decorators. Choose one of them and left JoinColumn decorator only on it.`;
    }

}