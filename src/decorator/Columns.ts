import "reflect-metadata";
import {defaultMetadataStorage} from "../metadata-builder/MetadataStorage";
import {ColumnMetadata} from "../metadata-builder/metadata/ColumnMetadata";
import {ColumnOptions} from "../metadata-builder/options/ColumnOptions";

/**
 * Column decorator is used to mark a specific class property as a table column. Only table columns will be
 * persisted to the database when document is being saved.
 */
export function Column(options?: ColumnOptions): Function;
export function Column(type?: string, options?: ColumnOptions): Function;
export function Column(typeOrOptions?: string|ColumnOptions, options?: ColumnOptions): Function {
    let type: string;
    if (typeof typeOrOptions === "string") {
        type = <string> typeOrOptions;
    } else {
        options = <ColumnOptions> typeOrOptions;
    }
    return function (object: Object, propertyName: string) {

        if (!type)
            type = Reflect.getMetadata("design:type", object, propertyName);

        if (!options)
            options = {};

        if (!options.type)
            options.type = type;

        if (options.isAutoIncrement)
            throw new Error(`Column for property ${propertyName} in ${(<any>object.constructor).name} cannot have auto increment. To have this ability you need to use @PrimaryColumn decorator.`);

        // todo: need proper type validation here

        const metadata = new ColumnMetadata(object.constructor, propertyName, false, false, false, options);
        defaultMetadataStorage.addColumnMetadata(metadata);
    };
}

/**
 * Column decorator is used to mark a specific class property as a table column. Only table columns will be
 * persisted to the database when document is being saved.
 */
export function PrimaryColumn(options?: ColumnOptions): Function;
export function PrimaryColumn(type?: string, options?: ColumnOptions): Function;
export function PrimaryColumn(typeOrOptions?: string|ColumnOptions, options?: ColumnOptions): Function {
    let type: string;
    if (typeof typeOrOptions === "string") {
        type = <string> typeOrOptions;
    } else {
        options = <ColumnOptions> typeOrOptions;
    }
    return function (object: Object, propertyName: string) {

        if (!type)
            type = Reflect.getMetadata("design:type", object, propertyName);

        if (!options)
            options = {};

        if (!options.type)
            options.type = type;

        if (options.isNullable)
            throw new Error(`Primary column for property ${propertyName} in ${(<any>object.constructor).name} cannot be nullable. Its not allowed for primary keys. Please remove isNullable option.`);

        // todo: need proper type validation here

        const metadata = new ColumnMetadata(object.constructor, propertyName, true, false, false, options);
        defaultMetadataStorage.addColumnMetadata(metadata);
    };
}