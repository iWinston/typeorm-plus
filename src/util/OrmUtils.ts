/** @internal */
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
    
}