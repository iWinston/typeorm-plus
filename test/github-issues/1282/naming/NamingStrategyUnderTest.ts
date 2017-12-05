import { DefaultNamingStrategy } from "../../../../src/naming-strategy/DefaultNamingStrategy";
import { NamingStrategyInterface } from "../../../../src/naming-strategy/NamingStrategyInterface";

export class NamingStrategyUnderTest extends DefaultNamingStrategy implements NamingStrategyInterface {

    calledJoinTableColumnName: boolean[] = [];

    calledJoinTableInverseColumnName: boolean[] = [];

    joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
        this.calledJoinTableColumnName.push(true);
        return super.joinTableColumnName(tableName, propertyName, columnName);
    }

    joinTableInverseColumnName(tableName: string, propertyName: string, columnName?: string): string {
        this.calledJoinTableInverseColumnName.push(true);
        return super.joinTableInverseColumnName(tableName, propertyName, columnName);
    }
}