import {Alias} from "./Alias";
import {IsNull} from "../find-options/operator/IsNull";

/**
 * Helper utility functions for QueryBuilder.
 */
export class QueryBuilderUtils {

    /**
     * Checks if given value is a string representation of alias property,
     * e.g. "post.category" or "post.id".
     */
    static isAliasProperty(str: any): str is string {

        // alias property must be a string and must have a dot separator
        if (typeof str !== "string" || str.indexOf(".") === -1)
            return false;

        // extra alias and its property relation
        const [aliasName, propertyName] = str.split("."); // todo: what about relations in embedded?
        if (!aliasName || !propertyName)
            return false;

        // alias and property must be represented in a special format
        // const aliasNameRegexp = /^[a-zA-Z0-9_-]+$/;
        // if (!aliasNameRegexp.test(aliasName) || !aliasNameRegexp.test(propertyName))
        //     return false;
        // make sure string is not a subquery
        if (str.indexOf("(") !== -1 || str.indexOf(")") !== -1)
            return false;

        return true;
    }

    static getScopeWhere(mainAlias: Alias, scope: string | false) {
        const metadata = mainAlias!.hasMetadata ? mainAlias!.metadata : undefined;
        if (metadata && scope) {
            const scopeWheres = (metadata.target as any).scope;
            if (scopeWheres && scopeWheres[scope]) {
                return scopeWheres[scope];
            }
            // default scope can't support deleteDateColumn in embedded now
            if (scope === "default" && metadata.deleteDateColumn && !metadata.deleteDateColumn.embeddedMetadata) {
                return {
                    [metadata.deleteDateColumn.propertyName]: IsNull()
                };
            }
        }
    }

}
