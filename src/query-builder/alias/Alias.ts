/**
 */
export class Alias {
    isMain: boolean;
    name: string;
    target: Function|string;
    parentPropertyName: string;
    parentAliasName: string;

    constructor(name: string) {
        this.name = name;
    }

    get selection() {
        return this.parentAliasName + "." + this.parentPropertyName;
    }

}