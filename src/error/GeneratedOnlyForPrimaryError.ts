export class GeneratedOnlyForPrimaryError extends Error {
    name = "GeneratedOnlyForPrimaryError";

    constructor(object: Object, propertyName: string) {
        super();
        this.message = `Column for property ${(<any>object.constructor).name}#${propertyName} cannot have a generated ` +
            `value. Generated values supports only in PrimaryColumn decorator or UUID column type.`;
        Object.setPrototypeOf(this, GeneratedOnlyForPrimaryError.prototype);
        this.stack = new Error().stack;
    }

}