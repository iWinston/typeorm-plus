import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {LazyRelationsWrapper} from "../repository/LazyRelationsWrapper";
import {IndexMetadata} from "../metadata/IndexMetadata";

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
            propertyName: args.joinTable.joinColumnName,
            mode: "virtual",
            options: <ColumnOptions> {
                length: column1.length,
                type: column1.type,
                name: args.joinTable.joinColumnName,
                nullable: false,
                primary: true
            }
        });
        const junctionColumn2 = new ColumnMetadata({
            propertyType: column2.type,
            propertyName: args.joinTable.inverseJoinColumnName,
            mode: "virtual",
            options: <ColumnOptions> {
                length: column2.length,
                type: column2.type,
                name: args.joinTable.inverseJoinColumnName,
                nullable: false,
                primary: true
            }
        });
        
        const entityMetadata = new EntityMetadata(lazyRelationsWrapper, {
            namingStrategy: args.namingStrategy,
            tableMetadata: tableMetadata,
            columnMetadatas: [
                junctionColumn1, 
                junctionColumn2
            ],
            foreignKeyMetadatas: [
                new ForeignKeyMetadata([junctionColumn1], args.firstTable, [column1]),
                new ForeignKeyMetadata([junctionColumn2], args.secondTable, [column2])
            ],
            indexMetadatas: [
                new IndexMetadata({ columns: [args.joinTable.joinColumnName], unique: false }),
                new IndexMetadata({ columns: [args.joinTable.inverseJoinColumnName], unique: false })
            ]
        });

        entityMetadata.columns[0].entityMetadata = entityMetadata;
        entityMetadata.columns[1].entityMetadata = entityMetadata;

        return entityMetadata;
    }
    
}