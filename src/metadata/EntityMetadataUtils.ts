import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Utils used to work with EntityMetadata objects.
 */
export class EntityMetadataUtils {

    /**
     * Creates a property paths for a given entity.
     */
    static createPropertyPath(entity: ObjectLiteral, prefix: string = "") {
        const paths: string[] = [];
        Object.keys(entity).forEach(key => {
            if (!entity[key]) return;
            if (entity[key] instanceof Object) {
                const subPaths = this.createPropertyPath(entity[key], key);
                paths.push(...subPaths);
            } else {
                const path = prefix ? prefix + "." + key : key;
                paths.push(path);
            }
        });
        return paths;
    }

}