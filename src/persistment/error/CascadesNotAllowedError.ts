import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";
import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";

export class CascadesNotAllowedError extends Error {
    name = "CascadesNotAllowedError";

    constructor(type: "insert"|"update"|"remove", metadata: EntityMetadata, relation: RelationMetadata) {
        super();
        const name = entityClassOrName instanceof Function ? (<any> entityClassOrName).name : entityClassOrName;
        this.message = `No broadcaster for "${name}" was found. Looks like this entity is not registered in your connection?`;
    }

}