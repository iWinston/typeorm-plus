import {ObjectLiteral} from "../common/ObjectLiteral";

export class OrmUtils {

    static groupBy<T, R>(array: T[], propertyCallback: (item: T) => R): { id: R, items: T[] }[] {
        return array.reduce((groupedArray, value) => {
            const key = propertyCallback(value);
            let grouped = groupedArray.find(i => i.id === key);
            if (!grouped) {
                grouped = { id: key, items: [] };
                groupedArray.push(grouped);
            }
            grouped.items.push(value);
            return groupedArray;
        }, [] as Array<{ id: R, items: T[] }>);
    }

    /**
     * Transforms given value into boolean value.
     */
    static toBoolean(value: any): boolean {
        if (typeof value === "boolean")
            return value;

        if (typeof value === "string")
            return value === "true" || value === "1";

        if (typeof value === "number")
            return value > 0;

        return false;
    }

    /**
     * Composes an object from the given array of keys and values.
     */
    static zipObject(keys: any[], values: any[]): ObjectLiteral {
        return keys.reduce((object, column, index) => {
            object[column] = values[index];
            return object;
        }, {} as ObjectLiteral);
    }

}