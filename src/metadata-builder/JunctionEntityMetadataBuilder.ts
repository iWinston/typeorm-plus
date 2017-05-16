import {EntityMetadata} from "../metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {JoinTableMetadataArgs} from "../metadata-args/JoinTableMetadataArgs";
import {Connection} from "../connection/Connection";

export class JunctionEntityMetadataBuilder {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    build(relation: RelationMetadata, joinTable: JoinTableMetadataArgs) {
        const referencedColumns = this.collectRelationReferencedColumns(relation, joinTable);
        const inverseReferencedColumns = this.collectRelationInverseReferencedColumns(relation, joinTable);

        const joinTableName = joinTable.name || this.connection.driver.namingStrategy.joinTableName(
                relation.entityMetadata.tableNameWithoutPrefix,
                relation.inverseEntityMetadata.tableNameWithoutPrefix,
                relation.propertyPath,
                relation.hasInverseSide ? relation.inverseRelation.propertyName : ""
            );

        const entityMetadata = new EntityMetadata({
            connection: this.connection,
            args: {
                target: "",
                name: joinTableName,
                type: "junction"
            }
        });
        const junctionColumns = referencedColumns.map(referencedColumn => {
            const joinColumn = joinTable.joinColumns ? joinTable.joinColumns.find(joinColumnArgs => {
                return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === referencedColumn.propertyName) &&
                    !!joinColumnArgs.name;
            }) : undefined;
            const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.connection.driver.namingStrategy.joinTableColumnName(relation.entityMetadata.tableNameWithoutPrefix, referencedColumn.propertyName, referencedColumn.givenDatabaseName);

            return new ColumnMetadata({
                entityMetadata: entityMetadata,
                referencedColumn: referencedColumn,
                args: {
                    target: "",
                    mode: "virtual",
                    propertyName: columnName,
                    options: {
                        name: columnName,
                        length: referencedColumn.length,
                        type: referencedColumn.type,
                        nullable: false,
                        primary: true,
                    }
                }
            });
        });

        const inverseJunctionColumns = inverseReferencedColumns.map(inverseReferencedColumn => {
            const joinColumn = joinTable.inverseJoinColumns ? joinTable.inverseJoinColumns.find(joinColumnArgs => {
                return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === inverseReferencedColumn.propertyName) &&
                    !!joinColumnArgs.name;
            }) : undefined;
            const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.connection.driver.namingStrategy.joinTableColumnName(relation.inverseEntityMetadata.tableNameWithoutPrefix, inverseReferencedColumn.propertyName, inverseReferencedColumn.givenDatabaseName);

            return new ColumnMetadata({
                entityMetadata: entityMetadata,
                referencedColumn: inverseReferencedColumn,
                args: {
                    target: "",
                    mode: "virtual",
                    propertyName: columnName,
                    options: {
                        length: inverseReferencedColumn.length,
                        type: inverseReferencedColumn.type,
                        name: columnName,
                        nullable: false,
                        primary: true,
                    }
                }
            });
        });

        entityMetadata.foreignKeys = [
            new ForeignKeyMetadata({
                entityMetadata: entityMetadata,
                referencedEntityMetadata: relation.entityMetadata,
                columns: junctionColumns,
                referencedColumns: referencedColumns
            }),
            new ForeignKeyMetadata({
                entityMetadata: entityMetadata,
                referencedEntityMetadata: relation.inverseEntityMetadata,
                columns: inverseJunctionColumns,
                referencedColumns: inverseReferencedColumns
            }),
        ];

        junctionColumns.concat(inverseJunctionColumns).forEach(column => column.relationMetadata = relation);
        entityMetadata.ownColumns = junctionColumns.concat(inverseJunctionColumns);
        entityMetadata.indices = [
            new IndexMetadata({
                entityMetadata: entityMetadata,
                columns: junctionColumns,
                args: {
                    target: "",
                    unique: false
                }
            }),

            new IndexMetadata({
                entityMetadata: entityMetadata,
                columns: inverseJunctionColumns,
                args: {
                    target: "",
                    unique: false
                }
            })
        ];

        return entityMetadata;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected collectRelationReferencedColumns(relation: RelationMetadata, joinTable: JoinTableMetadataArgs) {
        const hasAnyReferencedColumnName = joinTable.joinColumns ? joinTable.joinColumns.find(joinColumn => !!joinColumn.referencedColumnName) : false;
        if (!joinTable.joinColumns || (joinTable.joinColumns && !hasAnyReferencedColumnName)) {
            return relation.entityMetadata.ownColumns.filter(column => column.isPrimary);
        } else {
            return joinTable.joinColumns.map(joinColumn => {
                const referencedColumn = relation.entityMetadata.ownColumns.find(column => column.propertyName === joinColumn.referencedColumnName);
                if (!referencedColumn)
                    throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.entityMetadata.name}`);

                return referencedColumn;
            });
        }
    }

    protected collectRelationInverseReferencedColumns(relation: RelationMetadata, joinTable: JoinTableMetadataArgs) {
        const hasInverseJoinColumns = !!joinTable.inverseJoinColumns;
        const hasAnyInverseReferencedColumnName = hasInverseJoinColumns ? joinTable.inverseJoinColumns!.find(joinColumn => !!joinColumn.referencedColumnName) : false;
        if (!hasInverseJoinColumns || (hasInverseJoinColumns && !hasAnyInverseReferencedColumnName)) {
            return relation.inverseEntityMetadata.primaryColumns;
        } else {
            return joinTable.inverseJoinColumns!.map(joinColumn => {
                const referencedColumn = relation.inverseEntityMetadata.ownColumns.find(column => column.propertyName === joinColumn.referencedColumnName);
                if (!referencedColumn)
                    throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`);

                return referencedColumn;
            });
        }
    }

}