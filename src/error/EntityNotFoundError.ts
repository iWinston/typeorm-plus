import {ObjectType} from "../common/ObjectType";

/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
export class EntityNotFoundError extends Error {
    name = "EntityNotFound";

    constructor(entityClass: ObjectType<any>|string, criteria: any) {
        super();
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);

        const className = (typeof entityClass === "string") ? entityClass : entityClass.constructor.name;
        const criteriaString = this.stringifyCriteria(criteria);
        this.message = `Could not find any entity of type "${className}" matching: ${criteriaString}`;
        Object.setPrototypeOf(this, EntityNotFoundError.prototype);
        this.stack = new Error().stack;
    }

    private stringifyCriteria(criteria: any): string {
        try {
            return JSON.stringify(criteria, null, 4);
        } catch (e) { }
        return "" + criteria;
    }

}
