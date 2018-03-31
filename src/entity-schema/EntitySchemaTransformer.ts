import {EntitySchema} from "./EntitySchema";
import {MetadataArgsStorage} from "../metadata-args/MetadataArgsStorage";
import {TableMetadataArgs} from "../metadata-args/TableMetadataArgs";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {IndexMetadataArgs} from "../metadata-args/IndexMetadataArgs";
import {RelationMetadataArgs} from "../metadata-args/RelationMetadataArgs";
import {JoinColumnMetadataArgs} from "../metadata-args/JoinColumnMetadataArgs";
import {JoinTableMetadataArgs} from "../metadata-args/JoinTableMetadataArgs";
import {JoinTableOptions} from "../decorator/options/JoinTableOptions";
import {JoinTableMultipleColumnsOptions} from "../decorator/options/JoinTableMuplipleColumnsOptions";
import {ColumnMode} from "../metadata-args/types/ColumnMode";
import {GeneratedMetadataArgs} from "../metadata-args/GeneratedMetadataArgs";

/**
 * Transforms entity schema into metadata args storage.
 * The result will be just like entities read from decorators.
 */
export class EntitySchemaTransformer {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Transforms entity schema into new metadata args storage object.
     */
    transform(schemas: EntitySchema<any>[]): MetadataArgsStorage {
        const metadataArgsStorage = new MetadataArgsStorage();

        schemas.forEach(entitySchema => {
            const options = entitySchema.options;

            // add table metadata args from the schema
            const table = options.table || {} as any;
            const tableMetadata: TableMetadataArgs = {
                target: options.target || options.name,
                name: table.name,
                type: table.type || "regular",
                orderBy: table.orderBy
            };
            metadataArgsStorage.tables.push(tableMetadata);

            // add columns metadata args from the schema
            Object.keys(options.columns).forEach(columnName => {
                const tableColumn = options.columns[columnName]!;
                let mode: ColumnMode = "regular";
                if (tableColumn.createDate)
                    mode = "createDate";
                if (tableColumn.updateDate)
                    mode = "updateDate";
                if (tableColumn.version)
                    mode = "version";
                if (tableColumn.treeChildrenCount)
                    mode = "treeChildrenCount";
                if (tableColumn.treeLevel)
                    mode = "treeLevel";
                if (tableColumn.objectId)
                    mode = "objectId";

                const columnAgrs: ColumnMetadataArgs = {
                    target: options.target || options.name,
                    mode: mode,
                    propertyName: columnName,
                    options: {
                        type: tableColumn.type,
                        name: tableColumn.objectId ? "_id" : tableColumn.name,
                        length: tableColumn.length,
                        primary: tableColumn.primary,
                        unique: tableColumn.unique,
                        nullable: tableColumn.nullable,
                        comment: tableColumn.comment,
                        default: tableColumn.default,
                        precision: tableColumn.precision,
                        scale: tableColumn.scale
                    }
                };
                metadataArgsStorage.columns.push(columnAgrs);

                if (tableColumn.generated) {
                    const generationArgs: GeneratedMetadataArgs = {
                        target: options.target || options.name,
                        propertyName: columnName,
                        strategy: typeof tableColumn.generated === "string" ? tableColumn.generated : "increment"
                    };
                    metadataArgsStorage.generations.push(generationArgs);
                }
            });

            // add relation metadata args from the schema
            if (options.relations) {
                Object.keys(options.relations).forEach(relationName => {
                    const relationSchema = options.relations![relationName]!;
                    const relation: RelationMetadataArgs = {
                        target: options.target || options.name,
                        propertyName: relationName,
                        relationType: relationSchema.type,
                        isLazy: relationSchema.isLazy || false,
                        type: relationSchema.target,
                        inverseSideProperty: relationSchema.inverseSide,
                        isTreeParent: relationSchema.isTreeParent,
                        isTreeChildren: relationSchema.isTreeChildren,
                        options: {
                            eager: relationSchema.isEager || false,
                            cascade: relationSchema.cascade,
                            nullable: relationSchema.nullable,
                            onDelete: relationSchema.onDelete
                        }
                    };

                    metadataArgsStorage.relations.push(relation);

                    // add join column
                    if (relationSchema.joinColumn) {
                        if (typeof relationSchema.joinColumn === "boolean") {
                            const joinColumn: JoinColumnMetadataArgs = {
                                target: options.target || options.name,
                                propertyName: relationName
                            };
                            metadataArgsStorage.joinColumns.push(joinColumn);
                        } else {
                            const joinColumn: JoinColumnMetadataArgs = {
                                target: options.target || options.name,
                                propertyName: relationName,
                                name: relationSchema.joinColumn.name,
                                referencedColumnName: relationSchema.joinColumn.referencedColumnName
                            };
                            metadataArgsStorage.joinColumns.push(joinColumn);
                        }
                    }

                    // add join table
                    if (relationSchema.joinTable) {
                        if (typeof relationSchema.joinTable === "boolean") {
                            const joinTable: JoinTableMetadataArgs = {
                                target: options.target || options.name,
                                propertyName: relationName
                            };
                            metadataArgsStorage.joinTables.push(joinTable);
                        } else {
                            const joinTable: JoinTableMetadataArgs = {
                                target: options.target || options.name,
                                propertyName: relationName,
                                name: relationSchema.joinTable.name,
                                joinColumns: ((relationSchema.joinTable as JoinTableOptions).joinColumn ? [(relationSchema.joinTable as JoinTableOptions).joinColumn!] : (relationSchema.joinTable as JoinTableMultipleColumnsOptions).joinColumns) as any,
                                inverseJoinColumns: ((relationSchema.joinTable as JoinTableOptions).inverseJoinColumn ? [(relationSchema.joinTable as JoinTableOptions).inverseJoinColumn!] : (relationSchema.joinTable as JoinTableMultipleColumnsOptions).inverseJoinColumns) as any,
                            };
                            metadataArgsStorage.joinTables.push(joinTable);
                        }
                    }
                });
            }

            // add relation metadata args from the schema
            if (options.indices) {
                Object.keys(options.indices).forEach(indexName => {
                    const tableIndex = options.indices![indexName];
                    const indexAgrs: IndexMetadataArgs = {
                        target: options.target || options.name,
                        name: indexName,
                        unique: tableIndex.unique === true ? true : false,
                        synchronize: tableIndex.synchronize === false ? false : true,
                        sparse: tableIndex.sparse,
                        columns: tableIndex.columns
                    };
                    metadataArgsStorage.indices.push(indexAgrs);
                });
            }

        });

        return metadataArgsStorage;
    }
}
