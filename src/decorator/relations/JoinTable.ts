import {defaultMetadataStorage} from "../../typeorm";
import {JoinTableOptions} from "../../metadata-builder/options/JoinTableOptions";
import {JoinTableMetadata} from "../../metadata-builder/metadata/JoinTableMetadata";

/**
 */
export function JoinTable<T>(options: JoinTableOptions): Function {
    return function (object: Object, propertyName: string) {
        const metadata = new JoinTableMetadata(object.constructor, propertyName, options);
        defaultMetadataStorage().addJoinTableMetadata(metadata);
    };
}

