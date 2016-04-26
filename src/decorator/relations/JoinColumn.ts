import {defaultMetadataStorage} from "../../typeorm";
import {JoinTableOptions} from "../../metadata/options/JoinTableOptions";
import {JoinColumnMetadata} from "../../metadata/JoinColumnMetadata";

/**
 */
export function JoinColumn(options?: JoinTableOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinTableOptions;
        const metadata = new JoinColumnMetadata(object.constructor, propertyName, options);
        defaultMetadataStorage().addJoinColumnMetadata(metadata);
    };
}

