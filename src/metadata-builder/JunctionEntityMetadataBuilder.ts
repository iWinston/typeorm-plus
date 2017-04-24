import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {Driver} from "../driver/Driver";

/**
 * Helps to create EntityMetadatas for junction tables.
 */
export interface JunctionEntityMetadataBuilderArgs {
    namingStrategy: NamingStrategyInterface;
    firstTable: TableMetadata;
    secondTable: TableMetadata;
    joinTable: JoinTableMetadata;
}

/**
 * Helps to create EntityMetadatas for junction tables.
 */
export class JunctionEntityMetadataBuilder {

    build(driver: Driver, lazyRelationsWrapper: LazyRelationsWrapper, args: JunctionEntityMetadataBuilderArgs) {

        const tableMetadata = new TableMetadata({
            target: "",
            name: args.joinTable.name,
            type: "junction"
        });

        const junctionColumns = args.joinTable.joinColumns.map(joinColumn => {
            return new ColumnMetadata({
                target: "__virtual__",
                propertyName: joinColumn.name,
                mode: "virtual",
                options: <ColumnOptions> {
                    length: joinColumn.referencedColumn.length,
                    type: joinColumn.referencedColumn.type,
                    name: joinColumn.name,
                    nullable: false,
                    primary: true
                }
            });
        });

        const inverseJunctionColumns = args.joinTable.inverseJoinColumns.map(joinColumn => {
            return new ColumnMetadata({
                target: "__virtual__",
                propertyName: joinColumn.name,
                mode: "virtual",
                options: <ColumnOptions> {
                    length: joinColumn.referencedColumn.length,
                    type: joinColumn.referencedColumn.type,
                    name: joinColumn.name,
                    nullable: false,
                    primary: true
                }
            });
        });

        const junctionReferencedColumns = args.joinTable.joinColumns.map(joinColumn => joinColumn.referencedColumn);
        const inverseJunctionReferencedColumns = args.joinTable.inverseJoinColumns.map(joinColumn => joinColumn.referencedColumn);

        const junctionColumnNames = args.joinTable.joinColumns.map(joinColumn => joinColumn.name);
        const inverseJunctionColumnNames = args.joinTable.inverseJoinColumns.map(joinColumn => joinColumn.name);

        const entityMetadata = new EntityMetadata({
            junction: true,
            target: "__virtual__",
            tablesPrefix: driver.options.tablesPrefix,
            namingStrategy: args.namingStrategy,
            tableMetadata: tableMetadata,
            columnMetadatas: junctionColumns.concat(inverseJunctionColumns),
            foreignKeyMetadatas: [
                new ForeignKeyMetadata(junctionColumns, args.firstTable, junctionReferencedColumns),
                new ForeignKeyMetadata(inverseJunctionColumns, args.secondTable, inverseJunctionReferencedColumns)
            ],
            indexMetadatas: [
                new IndexMetadata({ columns: junctionColumnNames, unique: false }),
                new IndexMetadata({ columns: inverseJunctionColumnNames, unique: false })
            ]
        }, lazyRelationsWrapper);

        entityMetadata.columns.forEach(column => column.entityMetadata = entityMetadata);

        return entityMetadata;
    }

}