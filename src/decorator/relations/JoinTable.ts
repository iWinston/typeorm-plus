import {getMetadataArgsStorage} from "../../index";
import {JoinTableOptions} from "../options/JoinTableOptions";
import {JoinTableMetadataArgs} from "../../metadata-args/JoinTableMetadataArgs";

/**
 * JoinTable decorator is used in many-to-many relationship to specify owner side of relationship.
 * Its also used to set a custom junction table's name, column names and referenced columns.
 */
export function JoinTable(options?: JoinTableOptions): Function {
    return function (object: Object, propertyName: string) {
        options = options || {} as JoinTableOptions;
        const args: JoinTableMetadataArgs = {
            target: object.constructor,
            propertyName: propertyName,
            name: options.name,
            joinColumn: options.joinColumn,
            inverseJoinColumn: options.inverseJoinColumn
        };
        getMetadataArgsStorage().joinTables.add(args);
    };
}

