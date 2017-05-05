import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadataValidator} from "./EntityMetadataValidator";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {MetadataArgsStorage} from "../metadata-args/MetadataArgsStorage";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {Driver} from "../driver/Driver";
import {EmbeddedMetadataArgs} from "../metadata-args/EmbeddedMetadataArgs";
import {RelationIdMetadata} from "../metadata/RelationIdMetadata";
import {RelationCountMetadata} from "../metadata/RelationCountMetadata";
import {ColumnTypes} from "../metadata/types/ColumnTypes";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {TableType} from "../metadata/types/TableTypes";
import {MetadataArgsUtils} from "../metadata-args/MetadataArgsUtils";

/**
 * Aggregates all metadata: table, column, relation into one collection grouped by tables for a given set of classes.
 */
export class EntityMetadataBuilder {

    // todo: type in function validation, inverse side function validation
    // todo: check on build for duplicate names, since naming checking was removed from MetadataStorage
    // todo: duplicate name checking for: table, relation, column, index, naming strategy, join tables/columns?
    // todo: check if multiple tree parent metadatas in validator
    // todo: tree decorators can be used only on closure table (validation)
    // todo: throw error if parent tree metadata was not specified in a closure table

    constructor(private driver: Driver,
                private lazyRelationsWrapper: LazyRelationsWrapper,
                private metadataArgsStorage: MetadataArgsStorage,
                private namingStrategy: NamingStrategyInterface) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(entityClasses?: Function[]): EntityMetadata[] {

        const entityMetadatas: EntityMetadata[] = [];
        const allTables = this.metadataArgsStorage.tables.toArray();
        const allColumns = this.metadataArgsStorage.columns.toArray();
        const allRelations = this.metadataArgsStorage.relations.toArray();
        const allRelationIds = this.metadataArgsStorage.relationIds.toArray();
        const allRelationCounts = this.metadataArgsStorage.relationCounts.toArray();
        const allEmbeddeds = this.metadataArgsStorage.embeddeds.toArray();
        const allIndices = this.metadataArgsStorage.indices.toArray();

        // filter out tables by a given allowed classes
        const allTableMetadataArgs = MetadataArgsUtils.filterByTarget(allTables, entityClasses);

        // filter out table metadata args for those we really create entity metadatas and tables in the db
        const realTables = allTableMetadataArgs.filter(table => table.type === "regular" || table.type === "closure" || table.type === "class-table-child");

        realTables.forEach(tableArgs => {
            const entityMetadata = new EntityMetadata(this.lazyRelationsWrapper);

            const inheritanceTree = tableArgs.target instanceof Function ? MetadataArgsUtils.getInheritanceTree(tableArgs.target) : [tableArgs.target]; // todo: implement later here inheritance for string-targets

            // collect all table embeddeds
            const findEmbeddedsRecursively = (embeddedArgs: EmbeddedMetadataArgs[]): EmbeddedMetadata[] => {
                return embeddedArgs.map(embeddedArgs => {
                    const embeddedType = embeddedArgs.type();
                    const columns = MetadataArgsUtils.filterByTarget(allColumns, [embeddedType])
                        .map(columnArgs => new ColumnMetadata(entityMetadata, columnArgs));
                    const relations = MetadataArgsUtils.filterByTarget(allRelations, [embeddedType])
                        .map(relationArgs => new RelationMetadata(entityMetadata, relationArgs));
                    const subEmbeddeds = findEmbeddedsRecursively(MetadataArgsUtils.filterByTarget(allEmbeddeds, [embeddedType]));
                    return new EmbeddedMetadata(entityMetadata, columns, relations, subEmbeddeds, embeddedArgs);
                });
            };
            const embeddeds = findEmbeddedsRecursively(MetadataArgsUtils.filterByTarget(allEmbeddeds, inheritanceTree));

            const columns = MetadataArgsUtils.filterByTarget(allColumns, inheritanceTree).map(args => new ColumnMetadata(entityMetadata, args));
            const relations = MetadataArgsUtils.filterByTarget(allRelations, inheritanceTree).map(args => new RelationMetadata(entityMetadata, args));
            const relationIds = MetadataArgsUtils.filterByTarget(allRelationIds, inheritanceTree).map(args => new RelationIdMetadata(entityMetadata, args));
            const relationCounts = MetadataArgsUtils.filterByTarget(allRelationCounts, inheritanceTree).map(args => new RelationCountMetadata(entityMetadata, args));
            const indices = MetadataArgsUtils.filterByTarget(allIndices, inheritanceTree).map(args => new IndexMetadata(entityMetadata, args));

            entityMetadata._orderBy = tableArgs.orderBy;
            entityMetadata.ownColumns = columns;
            entityMetadata.ownRelations = relations;
            entityMetadata.relationIds = relationIds;
            entityMetadata.relationCounts = relationCounts;
            entityMetadata.indices = indices;
            entityMetadata.embeddeds = embeddeds;
            // inheritanceType: mergedArgs.inheritance ? mergedArgs.inheritance.type : undefined,
            // discriminatorValue: discriminatorValueArgs ? discriminatorValueArgs.value : (tableArgs.target as any).name // todo: pass this to naming strategy to generate a name

            this.createEntityMetadata(entityMetadata, {
                target: tableArgs.target,
                tableType: tableArgs.type,
                userSpecifiedTableName: tableArgs.name,
                engine: tableArgs.engine,
                skipSchemaSync: tableArgs.skipSchemaSync,
            });

            entityMetadatas.push(entityMetadata);
            // create entity's relations join tables

        });

        // after all metadatas created we set inverse side (related) entity metadatas for all relation metadatas
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.relations.forEach(relation => {
                const inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type || (typeof relation.type === "string" && m.targetName === relation.type));
                if (!inverseEntityMetadata)
                    throw new Error("Entity metadata for " + entityMetadata.name + "#" + relation.propertyPath + " was not found.");

                relation.inverseEntityMetadata = inverseEntityMetadata;
            });
        });

        // generate virtual column with foreign key for class-table inheritance
        entityMetadatas.forEach(entityMetadata => {
            if (!entityMetadata.parentEntityMetadata)
                return;

            const parentPrimaryColumns = entityMetadata.parentEntityMetadata.primaryColumns;
            const parentIdColumns = parentPrimaryColumns.map(primaryColumn => {
                const columnName = this.namingStrategy.classTableInheritanceParentColumnName(entityMetadata.parentEntityMetadata.tableName, primaryColumn.propertyName);
                const column = new ColumnMetadata(entityMetadata);
                column.type = primaryColumn.type;
                column.propertyName = primaryColumn.propertyName; // todo: check why needed
                column._name = columnName;
                column.mode = "parentId";
                column.isUnique = true;
                column.isNullable = false;
                // column.entityTarget = entityMetadata.target;
                return column;
            });

            // add foreign key
            const foreignKey = new ForeignKeyMetadata(
                entityMetadata,
                parentIdColumns,
                entityMetadata.parentEntityMetadata,
                parentPrimaryColumns,
                "CASCADE"
            );
            entityMetadata.ownColumns.push(...parentIdColumns);
            entityMetadata.foreignKeys.push(foreignKey);
        });

        entityMetadatas.forEach(entityMetadata => {

            // create entity's relations join columns
            entityMetadata.oneToOneRelations
                .concat(entityMetadata.manyToOneRelations)
                .forEach(relation => {

                    // cases it should cover:
                    // 1. when join column is set with custom name and without referenced column name
                    // we need automatically set referenced column name - primary ids by default
                    // @JoinColumn({ name: "custom_name" })
                    // 2. when join column is set with only referenced column name
                    // we need automatically set join column name - relation name + referenced column name
                    // @JoinColumn({ referencedColumnName: "title" })
                    // 3. when join column is set without both referenced column name and join column name
                    // we need to automatically set both of them
                    // @JoinColumn()
                    // 4. when join column is not set at all (as in case of @ManyToOne relation)
                    // we need to create join column for it with proper referenced column name and join column name
                    // 5. when multiple join columns set none of referencedColumnName and name can be optional
                    // both options are required
                    // @JoinColumn([
                    //  { name: "category_title", referencedColumnName: "type" },
                    //  { name: "category_title", referencedColumnName: "name" },
                    // ])

                    // since for many-to-one relations having JoinColumn decorator is not required,
                    // we need to go thought each many-to-one relation without join column decorator set
                    // and create join column metadata args for them

                    const joinColumnArgsArray = this.metadataArgsStorage.findJoinColumns(relation.target, relation.propertyName);

                    const hasAnyReferencedColumnName = joinColumnArgsArray.find(joinColumnArgs => !!joinColumnArgs.referencedColumnName);
                    const manyToOneWithoutJoinColumn = joinColumnArgsArray.length === 0 && relation.isManyToOne;
                    const hasJoinColumnWithoutAnyReferencedColumnName = joinColumnArgsArray.length > 0 && !hasAnyReferencedColumnName;
                    let columns: ColumnMetadata[], referencedColumns: ColumnMetadata[];

                    if (manyToOneWithoutJoinColumn || hasJoinColumnWithoutAnyReferencedColumnName) { // covers case3 and case1
                        referencedColumns = relation.inverseEntityMetadata.primaryColumnsWithParentIdColumns;
                    } else { // cases with referenced columns defined
                        referencedColumns = joinColumnArgsArray.map(joinColumnArgs => {
                            const referencedColumn = relation.inverseEntityMetadata.columns.find(column => column.databaseName === joinColumnArgs.referencedColumnName);
                            if (!referencedColumn)
                                throw new Error(`Referenced column ${joinColumnArgs.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`);

                            return referencedColumn;
                        });
                    }

                    if (!referencedColumns.length) // this case if possible only for one-to-one non owning side
                        return;

                    columns = referencedColumns.map(referencedColumn => {

                        // in the case if relation has join column with only name set we need this check
                        const joinColumnMetadataArg = joinColumnArgsArray.find(joinColumnArgs => {
                            return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === referencedColumn.propertyName) &&
                                !!joinColumnArgs.name;
                        });
                        const joinColumnName = joinColumnMetadataArg ? joinColumnMetadataArg.name : this.namingStrategy.joinColumnName(relation.propertyName, referencedColumn.propertyName);

                        let relationalColumn = relation.entityMetadata.columns.find(column => column.databaseName === joinColumnName);
                        if (!relationalColumn) {
                            relationalColumn = new ColumnMetadata(entityMetadata, {
                                target: relation.entityMetadata.target,
                                propertyName: joinColumnName!,
                                mode: "virtual",
                                options: {
                                    name: joinColumnName,
                                    type: referencedColumn.type,
                                    nullable: relation.isNullable,
                                    primary: relation.isPrimary
                                }
                            });
                            relation.entityMetadata.addColumn(relationalColumn);
                        }
                        relationalColumn.relationMetadata = relation;
                        return relationalColumn;
                    });

                    const foreignKey = new ForeignKeyMetadata(
                        entityMetadata,
                        columns,
                        relation.inverseEntityMetadata,
                        referencedColumns,
                        relation.onDelete
                    );

                    relation.foreignKeys = [foreignKey];
                    relation.entityMetadata.foreignKeys.push(foreignKey);
                });
        });

        entityMetadatas.forEach(entityMetadata => {

            // create entity's relations join columns
            entityMetadata.manyToManyRelations.forEach(relation => {
                const joinTableMetadataArgs = this.metadataArgsStorage.findJoinTable(relation.target, relation.propertyName);
                if (!joinTableMetadataArgs) return;

                const joinTableName = joinTableMetadataArgs.name || relation.entityMetadata.namingStrategy.joinTableName(
                        relation.entityMetadata.tableNameWithoutPrefix,
                        relation.inverseEntityMetadata.tableNameWithoutPrefix,
                        relation.propertyPath,
                        relation.hasInverseSide ? relation.inverseRelation.propertyName : ""
                    );

                let referencedColumns: ColumnMetadata[];
                const hasJoinColumns = !!joinTableMetadataArgs.joinColumns;
                const hasAnyReferencedColumnName = hasJoinColumns ? joinTableMetadataArgs.joinColumns!.find(joinColumn => !!joinColumn.referencedColumnName) : false;
                if (!hasJoinColumns || (hasJoinColumns && !hasAnyReferencedColumnName)) {
                    referencedColumns = relation.entityMetadata.primaryColumnsWithParentIdColumns;
                } else {
                    referencedColumns = joinTableMetadataArgs.joinColumns!.map(joinColumn => {
                        const referencedColumn = relation.entityMetadata.columns.find(column => column.databaseName === joinColumn.referencedColumnName);
                        if (!referencedColumn)
                            throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.entityMetadata.name}`);

                        return referencedColumn;
                    });
                }

                let inverseReferencedColumns: ColumnMetadata[];
                const hasInverseJoinColumns = !!joinTableMetadataArgs.inverseJoinColumns;
                const hasAnyInverseReferencedColumnName = hasInverseJoinColumns ? joinTableMetadataArgs.inverseJoinColumns!.find(joinColumn => !!joinColumn.referencedColumnName) : false;
                if (!hasInverseJoinColumns || (hasInverseJoinColumns && !hasAnyInverseReferencedColumnName)) {
                    inverseReferencedColumns = relation.inverseEntityMetadata.primaryColumnsWithParentIdColumns;
                } else {
                    inverseReferencedColumns = joinTableMetadataArgs.inverseJoinColumns!.map(joinColumn => {
                        const referencedColumn = relation.inverseEntityMetadata.columns.find(column => column.databaseName === joinColumn.referencedColumnName);
                        if (!referencedColumn)
                            throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`);

                        return referencedColumn;
                    });
                }
                const junctionEntityMetadata = new EntityMetadata(this.lazyRelationsWrapper);

                const junctionColumns = referencedColumns.map(referencedColumn => {
                    const joinColumn = joinTableMetadataArgs.joinColumns ? joinTableMetadataArgs.joinColumns.find(joinColumnArgs => {
                        return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === referencedColumn.propertyName) &&
                            !!joinColumnArgs.name;
                    }) : undefined;
                    const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.namingStrategy.joinTableColumnName(relation.entityMetadata.tableNameWithoutPrefix, referencedColumn.databaseName);

                    return new ColumnMetadata(junctionEntityMetadata, {
                        propertyName: columnName,
                        mode: "virtual",
                        options: <ColumnOptions> {
                            length: referencedColumn.length,
                            type: referencedColumn.type,
                            name: columnName,
                            nullable: false,
                            primary: true
                        }
                    });
                });

                const inverseJunctionColumns = inverseReferencedColumns.map(inverseReferencedColumn => {
                    const joinColumn = joinTableMetadataArgs.inverseJoinColumns ? joinTableMetadataArgs.inverseJoinColumns.find(joinColumnArgs => {
                            return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === inverseReferencedColumn.propertyName) &&
                                !!joinColumnArgs.name;
                        }) : undefined;
                    const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.namingStrategy.joinTableColumnName(relation.inverseEntityMetadata.tableNameWithoutPrefix, inverseReferencedColumn.databaseName);

                    return new ColumnMetadata(junctionEntityMetadata, {
                        propertyName: columnName,
                        mode: "virtual",
                        options: <ColumnOptions> {
                            length: inverseReferencedColumn.length,
                            type: inverseReferencedColumn.type,
                            name: columnName,
                            nullable: false,
                            primary: true
                        }
                    });
                });

                const foreignKeys = [
                    new ForeignKeyMetadata(junctionEntityMetadata, junctionColumns, relation.entityMetadata, referencedColumns),
                    new ForeignKeyMetadata(junctionEntityMetadata, inverseJunctionColumns, relation.inverseEntityMetadata, inverseReferencedColumns)
                ];

                junctionColumns.concat(inverseJunctionColumns).forEach(column => column.relationMetadata = relation);
                junctionEntityMetadata.isJunction = true;
                junctionEntityMetadata.namingStrategy = this.namingStrategy;
                junctionEntityMetadata.ownColumns = junctionColumns.concat(inverseJunctionColumns);
                junctionEntityMetadata.foreignKeys = foreignKeys;
                junctionEntityMetadata.indices = [ // todo: shall we remove indices?
                    new IndexMetadata(junctionEntityMetadata, { columns: junctionColumns.map(column => column.databaseName), unique: false }),
                    new IndexMetadata(junctionEntityMetadata, { columns: inverseJunctionColumns.map(column => column.databaseName), unique: false })
                ];
                this.createEntityMetadata(junctionEntityMetadata, {
                    tableType: "junction",
                    userSpecifiedTableName: joinTableName,
                });

                relation.foreignKeys = foreignKeys;
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.hasInverseSide)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;

                entityMetadatas.push(junctionEntityMetadata);
            });

        });

        // generate keys for tables with single-table inheritance
        entityMetadatas
            .filter(metadata => metadata.inheritanceType === "single-table" && metadata.hasDiscriminatorColumn)
            .forEach(metadata => {
                const indexForKey = new IndexMetadata(metadata, {
                    target: metadata.target,
                    columns: [metadata.discriminatorColumn.databaseName],
                    unique: false
                });
                metadata.indices.push(indexForKey);

                const indexForKeyWithPrimary = new IndexMetadata(metadata, {
                    target: metadata.target,
                    columns: [metadata.firstPrimaryColumn.propertyName, metadata.discriminatorColumn.propertyName],
                    unique: false
                });
                metadata.indices.push(indexForKeyWithPrimary);
            });

        // generate junction tables for all closure tables
        entityMetadatas.forEach(metadata => {
            if (!metadata.isClosure)
                return;

            if (metadata.primaryColumns.length > 1)
                throw new Error(`Cannot use given entity ${metadata.name} as a closure table, because it have multiple primary keys. Entities with multiple primary keys are not supported in closure tables.`);

            const closureJunctionEntityMetadata = new EntityMetadata(this.lazyRelationsWrapper);

            const columns = [
                new ColumnMetadata(closureJunctionEntityMetadata, <ColumnMetadataArgs> {
                    propertyName: "__virtual__", // check how property name is used
                    propertyType: metadata.firstPrimaryColumn.type,
                    mode: "virtual",
                    options: <ColumnOptions> {
                        length: metadata.firstPrimaryColumn.length,
                        type: metadata.firstPrimaryColumn.type,
                        name: "ancestor"
                    }
                }),
                new ColumnMetadata(closureJunctionEntityMetadata, <ColumnMetadataArgs> {
                    propertyName: "__virtual__", // check how property name is used
                    propertyType: metadata.firstPrimaryColumn.type,
                    mode: "virtual",
                    options: <ColumnOptions> {
                        length: metadata.firstPrimaryColumn.length,
                        type: metadata.firstPrimaryColumn.type,
                        name: "descendant"
                    }
                })
            ];

            if (metadata.hasTreeLevelColumn) {
                columns.push(new ColumnMetadata(closureJunctionEntityMetadata, <ColumnMetadataArgs> {
                    propertyName: "__virtual__", // check how property name is used
                    propertyType: ColumnTypes.INTEGER,
                    mode: "virtual",
                    options: {
                        type: ColumnTypes.INTEGER,
                        name: "level"
                    }
                }));
            }

            closureJunctionEntityMetadata.isJunction = true;
            closureJunctionEntityMetadata.ownColumns = columns;
            closureJunctionEntityMetadata.foreignKeys = [
                new ForeignKeyMetadata(closureJunctionEntityMetadata, [columns[0]], metadata, [metadata.firstPrimaryColumn]),
                new ForeignKeyMetadata(closureJunctionEntityMetadata, [columns[1]], metadata, [metadata.firstPrimaryColumn])
            ];
            this.createEntityMetadata(closureJunctionEntityMetadata, {
                tableType: "closure-junction",
                closureOwnerTableName: metadata.tableName,
            });

            metadata.closureJunctionTable = closureJunctionEntityMetadata;
            entityMetadatas.push(closureJunctionEntityMetadata);
        });

        // add lazy initializer for entity relations
        entityMetadatas.forEach(entityMetadata => {
            if (entityMetadata.target instanceof Function) {
                entityMetadata.relations
                    .filter(relation => relation.isLazy)
                    .forEach(relation => {
                        this.lazyRelationsWrapper.wrap((entityMetadata.target as Function).prototype, relation);
                    });
            }
        });

        return entityMetadatas;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected createEntityMetadata(metadata: EntityMetadata, options: {
        target?: Function|string,
        tableType: TableType,
        userSpecifiedTableName?: string,
        closureOwnerTableName?: string,
        engine?: string,
        skipSchemaSync?: boolean,
    }) {

        let target = options.target;
        const tableNameUserSpecified = options.userSpecifiedTableName;
        const tableType = options.tableType;
        const isClosureJunction = tableType === "closure-junction";
        const targetName = target instanceof Function ? (target as any).name : target;
        const tableNameWithoutPrefix = isClosureJunction
            ? this.namingStrategy.closureJunctionTableName(options.closureOwnerTableName!)
            : this.namingStrategy.tableName(targetName, options.userSpecifiedTableName);

        const tableName = this.namingStrategy.prefixTableName(this.driver.options.tablesPrefix, tableNameWithoutPrefix);

        // for virtual tables (like junction table) target is equal to undefined at this moment
        // we change this by setting virtual's table name to a target name
        // todo: add validation so targets with same schema names won't conflicts with virtual table names
        metadata.tableType = tableType;
        metadata.target = target ? target : tableName;
        metadata.targetName = targetName;
        metadata.tableNameUserSpecified = tableNameUserSpecified;
        metadata.tableNameWithoutPrefix = tableNameWithoutPrefix;
        metadata.tableName = tableName;
        metadata.name = targetName ? targetName : tableName;
        metadata.engine = options.engine;
        metadata.skipSchemaSync = options.skipSchemaSync || false;
        metadata.namingStrategy = this.namingStrategy;
    }

    /*protected createEntityMetadata(tableArgs: any, argsForTable: any, ): EntityMetadata {
        const metadata = new EntityMetadata({
            junction: false,
            target: tableArgs.target,
            tablesPrefix: this.driver.options.tablesPrefix,
            namingStrategy: this.namingStrategy,
            tableName: argsForTable.name,
            tableType: argsForTable.type,
            orderBy: argsForTable.orderBy,
            engine: argsForTable.engine,
            skipSchemaSync: argsForTable.skipSchemaSync,
            columnMetadatas: columns,
            relationMetadatas: relations,
            relationIdMetadatas: relationIds,
            relationCountMetadatas: relationCounts,
            indexMetadatas: indices,
            embeddedMetadatas: embeddeds,
            inheritanceType: mergedArgs.inheritance ? mergedArgs.inheritance.type : undefined,
            discriminatorValue: discriminatorValueArgs ? discriminatorValueArgs.value : (tableArgs.target as any).name // todo: pass this to naming strategy to generate a name
        }, this.lazyRelationsWrapper);
        return metadata;
    }*/

}


// const tables = [mergedArgs.table].concat(mergedArgs.children);
// tables.forEach(tableArgs => {

// find embeddable tables for embeddeds registered in this table and create EmbeddedMetadatas from them
// const findEmbeddedsRecursively = (embeddedArgs: EmbeddedMetadataArgs[]) => {
//     const embeddeds: EmbeddedMetadata[] = [];
//     embeddedArgs.forEach(embedded => {
//         const embeddableTable = embeddableMergedArgs.find(embeddedMergedArgs => embeddedMergedArgs.table.target === embedded.type());
//         if (embeddableTable) {
//             const columns = embeddableTable.columns.toArray().map(args => new ColumnMetadata(args));
//             const relations = embeddableTable.relations.toArray().map(args => new RelationMetadata(args));
//             const subEmbeddeds = findEmbeddedsRecursively(embeddableTable.embeddeds.toArray());
//             embeddeds.push(new EmbeddedMetadata(columns, relations, subEmbeddeds, embedded));
//         }
//     });
//     return embeddeds;
// };
// const embeddeds = findEmbeddedsRecursively(mergedArgs.embeddeds.toArray());

// create metadatas from args
// const argsForTable = mergedArgs.inheritance && mergedArgs.inheritance.type === "single-table" ? mergedArgs.table : tableArgs;

// const table = new TableMetadata(argsForTable);
// const columns = mergedArgs.columns.toArray().map(args => {
//
//     // if column's target is a child table then this column should have all nullable columns
//     if (mergedArgs.inheritance &&
//         mergedArgs.inheritance.type === "single-table" &&
//         args.target !== mergedArgs.table.target && !!mergedArgs.children.find(childTable => childTable.target === args.target)) {
//         args.options.nullable = true;
//     }
//     return new ColumnMetadata(args);
// });
// const discriminatorValueArgs = mergedArgs.discriminatorValues.find(discriminatorValueArgs => {
//     return discriminatorValueArgs.target === tableArgs.target;
// });



// after all metadatas created we set parent entity metadata for class-table inheritance
// entityMetadatas.forEach(entityMetadata => {
//     const mergedArgs = realTables.find(args => args.target === entityMetadata.target);
//     if (mergedArgs && mergedArgs.parent) {
//         const parentEntityMetadata = entityMetadatas.find(entityMetadata => entityMetadata.target === (mergedArgs!.parent! as any).target); // todo: weird compiler error here, thats why type casing is used
//         if (parentEntityMetadata)
//             entityMetadata.parentEntityMetadata = parentEntityMetadata;
//     }
// });