/**
 * Metadata args utility functions.
 */
export class MetadataUtils {

    /**
     * Gets given's entity all inherited classes.
     * Gives in order from parents to children.
     * For example Post extends ContentModel which extends Unit it will give
     * [Unit, ContentModel, Post]
     */
    static getInheritanceTree(entity: Function): Function[] {
        const tree: Function[] = [entity];
        const getPrototypeOf = (object: Function): void => {
            const proto = Object.getPrototypeOf(object);
            if (proto && proto.name) {
                tree.push(proto);
                getPrototypeOf(proto);
            }
        };
        getPrototypeOf(entity);
        return tree;
    }

    /**
     * Checks if this table is inherited from another table.
     */
    static isInherited(target1: Function, target2: Function) {
        // we cannot use instanceOf in this method, because we need order of inherited tables, to ensure that
        // properties get inherited in a right order. To achieve it we can only check a first parent of the class
        // return this.target.prototype instanceof anotherTable.target;
        return Object.getPrototypeOf(target1.prototype).constructor === target2;
    }

    /**
     * Filters given array of targets by a given classes.
     * If classes are not given, then it returns array itself.
     */
    static filterByTarget<T extends { target?: any }>(array: T[], classes?: any[]): T[] {
        if (!classes) return array;
        return array.filter(item => item.target && classes.indexOf(item.target) !== -1);
    }

}