export class AutoIncrementOnlyForPrimaryError extends Error {
    name = "AutoIncrementOnlyForPrimaryError";

    constructor(object: Object, propertyName: string) {
        super();
        this.message = `Column for property ${(<any>object.constructor).name}#${propertyName} cannot have an auto ` +
            `increment because its not a primary column. Try to use @PrimaryColumn decorator.`;
    }

}