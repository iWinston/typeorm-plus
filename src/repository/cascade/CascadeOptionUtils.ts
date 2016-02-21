import {CascadeOption, DynamicCascadeOptions} from "./CascadeOption";
import {DocumentSchema} from "../../schema/DocumentSchema";
import {RelationSchema} from "../../schema/RelationSchema";

export class CascadeOptionUtils {

    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------

    static prepareCascadeOptions(schema: DocumentSchema, cascadeOptions: DynamicCascadeOptions<any>): CascadeOption[] {
        if (cascadeOptions instanceof Function) {
            return (<((document: Document) => CascadeOption[])> cascadeOptions)(schema.createPropertiesMirror());

        } else if (cascadeOptions instanceof Object && !(cascadeOptions instanceof Array)) {
            return CascadeOptionUtils.convertFromObjectMap(cascadeOptions);
        }

        return <CascadeOption[]> cascadeOptions;
    }

    static find(cascadeOptions: CascadeOption[], fieldName: string) {
        return cascadeOptions ? cascadeOptions.reduce((found, cascade) => cascade.field === fieldName ? cascade : found, null) : null;
    }

    static isCascadeRemove(relation: RelationSchema, cascadeOption?: CascadeOption): boolean {
        if (relation.isCascadeRemove && !cascadeOption)
            return true;
        if (relation.isCascadeRemove && cascadeOption && cascadeOption.remove !== false)
            return true;
        if (cascadeOption && cascadeOption.remove)
            return true;

        return false;
    }

    static isCascadeInsert(relation: RelationSchema, cascadeOption?: CascadeOption): boolean {
        if (relation.isCascadeInsert && !cascadeOption)
            return true;
        if (relation.isCascadeInsert && cascadeOption && cascadeOption.insert !== false)
            return true;
        if (cascadeOption && cascadeOption.insert)
            return true;

        return false;
    }

    static isCascadeUpdate(relation: RelationSchema, cascadeOption?: CascadeOption): boolean {
        if (relation.isCascadeUpdate && !cascadeOption)
            return true;
        if (relation.isCascadeUpdate && cascadeOption && cascadeOption.update !== false)
            return true;
        if (cascadeOption && cascadeOption.update)
            return true;

        return false;
    }

    static isCascadePersist(relation: RelationSchema, cascadeOption?: CascadeOption): boolean {
        return this.isCascadeInsert(relation, cascadeOption) || this.isCascadeUpdate(relation, cascadeOption);
    }

    // -------------------------------------------------------------------------
    // Private Static Methods
    // -------------------------------------------------------------------------

    private static convertFromObjectMap(object: any): CascadeOption[] {
        if (!object)
            return [];

        return Object.keys(object).map(key => {
            let subCascadeKeys = Object.keys(object).filter(k => k.substr(0, key.length + 1) === key + ".");
            let subCascades = subCascadeKeys.reduce((v: any, k: string) => { v[k.substr(key.length + 1)] = object[k]; return v; }, {});
            if (key.indexOf(".") !== -1) return null;

            return <CascadeOption> {
                field: key,
                insert: !!object[key].insert,
                update: !!object[key].update,
                remove: !!object[key].remove,
                cascades: this.convertFromObjectMap(object[key].cascades ? object[key].cascades : subCascades)
            };
        }).filter(option => option !== null);
    }

}