import {ObjectLiteral} from "../common/ObjectLiteral";

export class OrmUtils {

    static splitClassesAndStrings<T>(clsesAndStrings: T[]|string[]): [T[], string[]] {
        return [
            (clsesAndStrings as T[]).filter(cls => typeof cls !== "string"),
            (clsesAndStrings as string[]).filter(str => typeof str === "string"),
        ];
    }

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

    static uniq<T>(array: T[], criteria?: (item: T) => any): T[];
    static uniq<T, K extends keyof T>(array: T[], property: K): T[];
    static uniq<T, K extends keyof T>(array: T[], criteriaOrProperty?: ((item: T) => any)|K): T[] {
        return array.reduce((uniqueArray, item) => {
            let found: boolean = false;
            if (criteriaOrProperty instanceof Function) {
                const itemValue = criteriaOrProperty(item);
                found = !!uniqueArray.find(uniqueItem => criteriaOrProperty(uniqueItem) === itemValue);

            } else if (typeof criteriaOrProperty === "string") {
                found = !!uniqueArray.find(uniqueItem => uniqueItem[criteriaOrProperty] === item[criteriaOrProperty]);

            } else {
                found = uniqueArray.indexOf(item) !== -1;
            }

            if (!found)
                uniqueArray.push(item);

            return uniqueArray;
        }, [] as T[]);
    }

    static isObject(item: any) {
        return (item && typeof item === "object" && !Array.isArray(item));
    }

    /**
     * Deep Object.assign.
     *
     * @see http://stackoverflow.com/a/34749873
     */
    static mergeDeep(target: any, ...sources: any[]): any {
        if (!sources.length) return target;
        const source = sources.shift();

        if (this.isObject(target) && this.isObject(source)) {
            for (const key in source) {
                let propertyKey = key;
                if (source[key] instanceof Promise)
                    continue;

                // if (source[key] instanceof Promise) {
                //     propertyKey = "__" + key + "__";
                // }

                if (this.isObject(source[propertyKey]) && !(source[propertyKey] instanceof Date)) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this.mergeDeep(target[key], source[propertyKey]);
                } else {
                    Object.assign(target, { [key]: source[propertyKey] });
                }
            }
        }

        return this.mergeDeep(target, ...sources);
    }

    /**
     * Deep compare objects.
     *
     * @see http://stackoverflow.com/a/1144249
     */
    static deepCompare(...args: any[]) {
        let i: any, l: any, leftChain: any, rightChain: any;

        function compare2Objects(x: any, y: any) {
            let p;

            // remember that NaN === NaN returns false
            // and isNaN(undefined) returns true
            if (isNaN(x) && isNaN(y) && typeof x === "number" && typeof y === "number")
                return true;

            // Compare primitives and functions.
            // Check if both arguments link to the same object.
            // Especially useful on the step where we compare prototypes
            if (x === y)
                return true;

            if (x.equals instanceof Function && x.equals(y))
                return true;

            // Works in case when functions are created in constructor.
            // Comparing dates is a common scenario. Another built-ins?
            // We can even handle functions passed across iframes
            if ((typeof x === "function" && typeof y === "function") ||
                (x instanceof Date && y instanceof Date) ||
                (x instanceof RegExp && y instanceof RegExp) ||
                (x instanceof String && y instanceof String) ||
                (x instanceof Number && y instanceof Number))
                return x.toString() === y.toString();

            // At last checking prototypes as good as we can
            if (!(x instanceof Object && y instanceof Object))
                return false;

            if (x.isPrototypeOf(y) || y.isPrototypeOf(x))
                return false;

            if (x.constructor !== y.constructor)
                return false;

            if (x.prototype !== y.prototype)
                return false;

            // Check for infinitive linking loops
            if (leftChain.indexOf(x) > -1 || rightChain.indexOf(y) > -1)
                return false;

            // Quick checking of one object being a subset of another.
            // todo: cache the structure of arguments[0] for performance
            for (p in y) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }
            }

            for (p in x) {
                if (y.hasOwnProperty(p) !== x.hasOwnProperty(p)) {
                    return false;
                }
                else if (typeof y[p] !== typeof x[p]) {
                    return false;
                }

                switch (typeof (x[p])) {
                    case "object":
                    case "function":

                        leftChain.push(x);
                        rightChain.push(y);

                        if (!compare2Objects (x[p], y[p])) {
                            return false;
                        }

                        leftChain.pop();
                        rightChain.pop();
                        break;

                    default:
                        if (x[p] !== y[p]) {
                            return false;
                        }
                        break;
                }
            }

            return true;
        }

        if (arguments.length < 1) {
            return true; // Die silently? Don't know how to handle such case, please help...
            // throw "Need two or more arguments to compare";
        }

        for (i = 1, l = arguments.length; i < l; i++) {

            leftChain = []; // Todo: this can be cached
            rightChain = [];

            if (!compare2Objects(arguments[0], arguments[i])) {
                return false;
            }
        }

        return true;
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

    /**
     * Implements topological sort.
     * Sorts given graph.
     *
     * Algorithm is kindly taken from https://github.com/marcelklehr/toposort repository.
     */
    static toposort(edges: any[][]) {

        function uniqueNodes(arr: any[]) {
            let res = [];
            for (let i = 0, len = arr.length; i < len; i++) {
                let edge: any = arr[i];
                if (res.indexOf(edge[0]) < 0) res.push(edge[0]);
                if (res.indexOf(edge[1]) < 0) res.push(edge[1]);
            }
            return res;
        }

        const nodes = uniqueNodes(edges);
        let cursor = nodes.length
            , sorted = new Array(cursor)
            , visited: any = {}
            , i = cursor;

        while (i--) {
            if (!visited[i]) visit(nodes[i], i, []);
        }

        function visit(node: any, i: number, predecessors: any[]) {
            if (predecessors.indexOf(node) >= 0) {
                throw new Error("Cyclic dependency: " + JSON.stringify(node));
            }

            if (!~nodes.indexOf(node)) {
                throw new Error("Found unknown node. Make sure to provided all involved nodes. Unknown node: " + JSON.stringify(node));
            }

            if (visited[i]) return;
            visited[i] = true;

            // outgoing edges
            let outgoing = edges.filter(function(edge){
                return edge[0] === node;
            });
            if (i = outgoing.length) {
                let preds = predecessors.concat(node);
                do {
                    let child = outgoing[--i][1];
                    visit(child, nodes.indexOf(child), preds);
                } while (i);
            }

            sorted[--cursor] = node;
        }

        return sorted;
    }

}