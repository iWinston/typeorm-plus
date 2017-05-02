import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {Driver} from "../driver/Driver";

/**
 * Helps to create EntityMetadatas for junction tables.
 */
export interface ClosureJunctionEntityMetadataBuilderArgs {
    namingStrategy: NamingStrategyInterface;
    entityMetadata: EntityMetadata;
    primaryColumn: ColumnMetadata;
    hasTreeLevelColumn: boolean;
}

/**
 * Helps to create EntityMetadatas for junction tables for closure tables.
 */
export class ClosureJunctionEntityMetadataBuilder {

    build(driver: Driver, lazyRelationsWrapper: LazyRelationsWrapper, args: ClosureJunctionEntityMetadataBuilderArgs) {

        const columns = [
            new ColumnMetadata(<ColumnMetadataArgs> {
                target: "__virtual__",
                propertyName: "__virtual__",
                propertyType: args.primaryColumn.type,
                mode: "virtual",
                options: <ColumnOptions> {
                    length: args.primaryColumn.length,
                    type: args.primaryColumn.type,
                    name: "ancestor"
                }
            }),
            new ColumnMetadata(<ColumnMetadataArgs> {
                target: "__virtual__",
                propertyName: "__virtual__",
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
                target: "__virtual__",
                propertyName: "__virtual__",
                propertyType: ColumnTypes.INTEGER,
                mode: "virtual",
                options: {
                    type: ColumnTypes.INTEGER,
                    name: "level"
                }
            }));
        }

        return new EntityMetadata({
            junction: true,
            target: "__virtual__",
            tablesPrefix: driver.options.tablesPrefix,
            namingStrategy: args.namingStrategy,
            tableName: args.entityMetadata.tableName,
            tableType: "closure-junction",
            columnMetadatas: columns,
            foreignKeyMetadatas: [
                new ForeignKeyMetadata([columns[0]], args.entityMetadata, [args.primaryColumn]),
                new ForeignKeyMetadata([columns[1]], args.entityMetadata, [args.primaryColumn])
            ]
        }, lazyRelationsWrapper);
    }

}