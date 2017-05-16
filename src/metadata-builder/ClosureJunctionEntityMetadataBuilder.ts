import {EntityMetadata} from "../metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {Connection} from "../connection/Connection";

export class ClosureJunctionEntityMetadataBuilder {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    build(parentClosureEntityMetadata: EntityMetadata) {
        const entityMetadata = new EntityMetadata({
            parentClosureEntityMetadata: parentClosureEntityMetadata,
            connection: this.connection,
            args: {
                target: "",
                name: parentClosureEntityMetadata.tableNameWithoutPrefix,
                type: "closure-junction"
            }
        });

        parentClosureEntityMetadata.primaryColumns.forEach(primaryColumn => {
            entityMetadata.ownColumns.push(new ColumnMetadata({
                entityMetadata: entityMetadata,
                args: {
                    target: "",
                    mode: "virtual",
                    propertyName: "ancestor_" + primaryColumn.databaseName, // todo: naming strategy
                    options: {
                        length: primaryColumn.length,
                        type: primaryColumn.type,
                    }
                }
            }));
            entityMetadata.ownColumns.push(new ColumnMetadata({
                entityMetadata: entityMetadata,
                args: {
                    target: "",
                    mode: "virtual",
                    propertyName: "descendant_" + primaryColumn.databaseName,
                    options: {
                        length: primaryColumn.length,
                        type: primaryColumn.type,
                    }
                }
            }));
        });

        if (parentClosureEntityMetadata.treeLevelColumn) {
            entityMetadata.ownColumns.push(new ColumnMetadata({
                entityMetadata: entityMetadata,
                args: {
                    target: "",
                    mode: "virtual",
                    propertyName: "level",
                    options: {
                        type: ColumnTypes.INTEGER,
                    }
                }
            }));
        }

        entityMetadata.foreignKeys = [
            new ForeignKeyMetadata({
                entityMetadata: entityMetadata,
                referencedEntityMetadata: parentClosureEntityMetadata,
                columns: [entityMetadata.ownColumns[0]],
                referencedColumns: parentClosureEntityMetadata.primaryColumns
            }),
            new ForeignKeyMetadata({
                entityMetadata: entityMetadata,
                referencedEntityMetadata: parentClosureEntityMetadata,
                columns: [entityMetadata.ownColumns[1]],
                referencedColumns: parentClosureEntityMetadata.primaryColumns
            }),
        ];

        return entityMetadata;
    }

}