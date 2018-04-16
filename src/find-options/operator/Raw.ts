import {FindOperator} from "../FindOperator";

/**
 * Find Options Operator.
 * Example: { someField: Raw([...]) }
 */
export function Raw<T>(value: string|((columnAlias?: string) => string)): any { // TODO: make this typecheck
    return new FindOperator<T>("raw", value as any, false);
}