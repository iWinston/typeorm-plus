import {defaultMetadataStorage} from "../../index";
import {JoinTableOptions} from "../../metadata/options/JoinTableOptions";
import {JoinTableMetadata} from "../../metadata/JoinTableMetadata";

/**
 */
export function JoinTable(options?: JoinTableOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinTableOptions;
        const metadata = new JoinTableMetadata(object.constructor, propertyName, options);
        defaultMetadataStorage().joinTableMetadatas.add(metadata);
    };
}

