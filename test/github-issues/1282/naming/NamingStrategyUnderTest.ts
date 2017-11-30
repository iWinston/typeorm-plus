import { DefaultNamingStrategy } from "../../../../src/naming-strategy/DefaultNamingStrategy";
import { NamingStrategyInterface } from "../../../../src/naming-strategy/NamingStrategyInterface";

export class NamingStrategyUnderTest extends DefaultNamingStrategy implements NamingStrategyInterface {

    calls: boolean[] = [];

    joinTableColumnName(tableName: string, propertyName: string, columnName?: string, inverse = false): string {
        this.calls.push(inverse);
        return super.joinTableColumnName(tableName, propertyName, columnName, inverse);
    }
}