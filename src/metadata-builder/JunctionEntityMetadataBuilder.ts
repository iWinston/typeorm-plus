import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";

/**
 * Helps to create EntityMetadatas for junction tables.
 *
 * @internal
 */
export interface JunctionEntityMetadataBuilderArgs {
    namingStrategy: NamingStrategyInterface;
    firstTable: TableMetadata;
    secondTable: TableMetadata;
    joinTable: JoinTableMetadata;
}

/**
 * Helps to create EntityMetadatas for junction tables.
 * 
 * @internal
 */
export class JunctionEntityMetadataBuilder {
    
    createJunctionEntityMetadata(args: JunctionEntityMetadataBuilderArgs) {

        const column1 = args.joinTable.referencedColumn;
        const column2 = args.joinTable.inverseReferencedColumn;
        
        const tableMetadata = new TableMetadata({
            name: args.joinTable.name,
            type: "junction"
        });
        
        const junctionColumn1 = new ColumnMetadata({
            propertyType: column1.type,
            mode: "virtual",
            options: <ColumnOptions> {
                length: column1.length,
                type: column1.type,
                name: args.joinTable.joinColumnName
            }
        });
        const junctionColumn2 = new ColumnMetadata({
            propertyType: column2.type,
            mode: "virtual",
            options: <ColumnOptions> {
                length: column2.length,
                type: column2.type,
                name: args.joinTable.inverseJoinColumnName
            }
        });
        const junctionColumns = [junctionColumn1, junctionColumn2];

        const foreignKey1 = new ForeignKeyMetadata(tableMetadata, [junctionColumns[0]], args.firstTable, [column2]);
        const foreignKey2 = new ForeignKeyMetadata(tableMetadata, [junctionColumns[1]], args.secondTable, [column2]);
        const foreignKeys = [foreignKey1, foreignKey2];
        
        const junctionEntityMetadata = new EntityMetadata({
            namingStrategy: args.namingStrategy,
            tableMetadata: tableMetadata,
            columnMetadatas: junctionColumns,
            foreignKeyMetadatas: foreignKeys,
        });
        junctionColumns.forEach(column => column.entityMetadata = junctionEntityMetadata);
        foreignKeys.forEach(column => column.entityMetadata = junctionEntityMetadata);
        tableMetadata.entityMetadata = junctionEntityMetadata;
        return junctionEntityMetadata;
    }
    
}