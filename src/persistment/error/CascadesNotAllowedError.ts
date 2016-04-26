import {EntityMetadata} from "../../metadata/EntityMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";

/**
 * @internal
 */
export class CascadesNotAllowedError extends Error {
    name = "CascadesNotAllowedError";

    constructor(type: "insert"|"update"|"remove", metadata: EntityMetadata, relation: RelationMetadata) {
        super();
        const cls = (<any> metadata.target).name;
        this.message = `Cascades (${type}) are not allowed for the given relation ${cls}#${relation.name}`;
    }

}