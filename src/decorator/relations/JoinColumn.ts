import {defaultMetadataStorage} from "../../typeorm";
import {JoinTableOptions} from "../../metadata/options/JoinTableOptions";
import {JoinColumnMetadata} from "../../metadata/JoinColumnMetadata";

/**
 */
export function JoinColumn<T>(options: JoinTableOptions): Function {
    return function (object: Object, propertyName: string) {
        const metadata = new JoinColumnMetadata(object.constructor, propertyName, options);
        defaultMetadataStorage().addJoinColumnMetadata(metadata);
    };
}

