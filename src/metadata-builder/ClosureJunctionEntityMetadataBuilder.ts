import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {ColumnTypes} from "../metadata/types/ColumnTypes";

/**
 * Helps to create EntityMetadatas for junction tables.
 *
 * @internal
 */
export interface ClosureJunctionEntityMetadataBuilderArgs {
    namingStrategy: NamingStrategyInterface;
    table: TableMetadata;
    primaryColumn: ColumnMetadata;
    hasTreeLevelColumn: boolean;
}

/**
 * Helps to create EntityMetadatas for junction tables for closure tables.
 * 
 * @internal
 */
export class ClosureJunctionEntityMetadataBuilder {
    
    build(args: ClosureJunctionEntityMetadataBuilderArgs) {

        const columns = [
            new ColumnMetadata(<ColumnMetadataArgs> {
                propertyType: args.primaryColumn.type,
                mode: "virtual",
                options: <ColumnOptions> {
                    length: args.primaryColumn.length,
                    type: args.primaryColumn.type,
                    name: "ancestor"
                }
            }), 
            new ColumnMetadata(<ColumnMetadataArgs> {
                propertyType: args.primaryColumn.type,
                mode: "virtual",
                options: <ColumnOptions> {
                    length: args.primaryColumn.length,
                    type: args.primaryColumn.type,
                    name: "descendant"
                }
            })
        ];
        
        if (args.hasTreeLevelColumn) {
            columns.push(new ColumnMetadata(<ColumnMetadataArgs> {
                propertyType: ColumnTypes.INTEGER,
                mode: "virtual",
                options: {
                    type: ColumnTypes.INTEGER,
                    name: "level"
                }
            }));
        }

        const closureJunctionTableMetadata = new TableMetadata(undefined, args.table.name, "closureJunction");

        return new EntityMetadata({
            namingStrategy: args.namingStrategy,
            tableMetadata: closureJunctionTableMetadata,
            columnMetadatas: columns,
            foreignKeyMetadatas: [
                new ForeignKeyMetadata([columns[0]], args.table, [args.primaryColumn]),
                new ForeignKeyMetadata([columns[1]], args.table, [args.primaryColumn])
            ]
        });
    }
    
}