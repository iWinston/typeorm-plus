import {defaultMetadataStorage} from "../../typeorm";
import {JoinColumnMetadata} from "../../metadata/JoinColumnMetadata";
import {JoinColumnOptions} from "../../metadata/options/JoinColumnOptions";

/**
 */
export function JoinColumn(options?: JoinColumnOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinColumnOptions;
        const metadata = new JoinColumnMetadata(object.constructor, propertyName, options);
        defaultMetadataStorage().joinColumnMetadatas.add(metadata);
    };
}

