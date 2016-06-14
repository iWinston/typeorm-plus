import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {LazyRelationsWrapper} from "../repository/LazyRelationsWrapper";

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
    
    build(lazyRelationsWrapper: LazyRelationsWrapper, args: JunctionEntityMetadataBuilderArgs) {

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
        
        return new EntityMetadata(lazyRelationsWrapper, {
            namingStrategy: args.namingStrategy,
            tableMetadata: tableMetadata,
            columnMetadatas: [
                junctionColumn1, 
                junctionColumn2
            ],
            foreignKeyMetadatas: [
                new ForeignKeyMetadata([junctionColumn1], args.firstTable, [column1]),
                new ForeignKeyMetadata([junctionColumn2], args.secondTable, [column2])
            ]
        });
    }
    
}