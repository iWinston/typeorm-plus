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
import {ColumnMetadataBuilder} from "./ColumnMetadataBuilder";
import {RelationMetadataBuilder} from "./RelationMetadataBuilder";
import {EmbeddedMetadataBuilder} from "./EmbeddedMetadataBuilder";
import {RelationCountMetadataBuilder} from "./RelationCountMetadataBuilder";
import {RelationIdMetadataBuilder} from "./RelationIdMetadataBuilder";
import {IndexMetadataBuilder} from "./IndexMetadataBuilder";
import {ForeignKeyMetadataBuilder} from "./ForeignKeyMetadataBuilder";
import {EntityMetadataBuilder} from "./EntityMetadataBuilder";

/**
 * Aggregates all metadata: table, column, relation into one collection grouped by tables for a given set of classes.
 */
export class AllEntityMetadataBuilder {

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

    private findEmbeddedsRecursively(entityMetadata: EntityMetadata, embeddedArgs: EmbeddedMetadataArgs[]): EmbeddedMetadata[] {
        return embeddedArgs.map(embeddedArgs => {

            const embeddedMetadata = new EmbeddedMetadata({ entityMetadata }, embeddedArgs);
            const columnArgs = this.metadataArgsStorage.filterColumns(embeddedMetadata.type);
            const relationArgs = this.metadataArgsStorage.filterRelations(embeddedMetadata.type);
            const subEmbeddedArgs = this.metadataArgsStorage.filterEmbeddeds(embeddedMetadata.type);

            embeddedMetadata.columns = columnArgs.map(args => new ColumnMetadata({ entityMetadata, embeddedMetadata }, args));
            embeddedMetadata.relations = relationArgs.map(args => new RelationMetadata({ entityMetadata, embeddedMetadata }, args));
            embeddedMetadata.embeddeds = this.findEmbeddedsRecursively(entityMetadata, subEmbeddedArgs);
            embeddedMetadata.embeddeds.forEach(subEmbedded => subEmbedded.parentEmbeddedMetadata = embeddedMetadata);
            return embeddedMetadata;
        });
    }

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(entityClasses?: Function[]): EntityMetadata[] {

        const storage = this.metadataArgsStorage;
        const entityMetadatas: EntityMetadata[] = [];
        const allTables = entityClasses ? storage.filterTables(entityClasses) : storage.tables.toArray();

        // filter out table metadata args for those we really create entity metadatas and tables in the db
        const realTables = allTables.filter(table => table.type === "regular" || table.type === "closure" || table.type === "class-table-child");

        realTables.forEach(tableArgs => {
            const inheritanceTree = tableArgs.target instanceof Function ? MetadataArgsUtils.getInheritanceTree(tableArgs.target) : [tableArgs.target]; // todo: implement later here inheritance for string-targets

            const embeddedArgs = storage.filterEmbeddeds(inheritanceTree);
            const columnArgs = storage.filterColumns(inheritanceTree);
            const relationArgs = storage.filterRelations(inheritanceTree);
            const relationIdArgs = storage.filterRelationIds(inheritanceTree);
            const relationCountArgs = storage.filterRelationCounts(inheritanceTree);
            const indexArgs = storage.filterIndices(inheritanceTree);

            // collect all table embeddeds
            const entityMetadata = new EntityMetadata({
                lazyRelationsWrapper: this.lazyRelationsWrapper,
                target: tableArgs.target,
                tableType: tableArgs.type,
                engine: tableArgs.engine,
                skipSchemaSync: tableArgs.skipSchemaSync || false,
                // orderBy: tableArgs.orderBy,
                // inheritanceType: mergedArgs.inheritance ? mergedArgs.inheritance.type : undefined,
                // discriminatorValue: discriminatorValueArgs ? discriminatorValueArgs.value : (tableArgs.target as any).name // todo: pass this to naming strategy to generate a name
            });
            entityMetadata.embeddeds = this.findEmbeddedsRecursively(entityMetadata, embeddedArgs);
            entityMetadata.ownColumns = columnArgs.map(args => new ColumnMetadata({ entityMetadata }, args));
            entityMetadata.ownRelations = relationArgs.map(args => new RelationMetadata({ entityMetadata }, args));
            entityMetadata.relationIds = relationIdArgs.map(args => new RelationIdMetadata({ entityMetadata }, args));
            entityMetadata.relationCounts = relationCountArgs.map(args => new RelationCountMetadata({ entityMetadata }, args));
            entityMetadata.indices = indexArgs.map(args => new IndexMetadata({ entityMetadata }, args));

            entityMetadatas.push(entityMetadata);
        });

        // calculate entity metadata computed properties and all its sub-metadatas
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.build(entityMetadatas, this.namingStrategy, this.driver.options.tablesPrefix);
        });


        // generate virtual column with foreign key for class-table inheritance
        /*entityMetadatas.forEach(entityMetadata => {
            if (!entityMetadata.parentEntityMetadata)
                return;

            const parentPrimaryColumns = entityMetadata.parentEntityMetadata.primaryColumns;
            const parentIdColumns = parentPrimaryColumns.map(primaryColumn => {
                const columnName = this.namingStrategy.classTableInheritanceParentColumnName(entityMetadata.parentEntityMetadata.tableName, primaryColumn.propertyName);
                const column = new ColumnMetadataBuilder(entityMetadata);
                column.type = primaryColumn.type;
                column.propertyName = primaryColumn.propertyName; // todo: check why needed
                column.givenName = columnName;
                column.mode = "parentId";
                column.isUnique = true;
                column.isNullable = false;
                // column.entityTarget = entityMetadata.target;
                return column;
            });

            // add foreign key
            const foreignKey = new ForeignKeyMetadataBuilder(
                entityMetadata,
                parentIdColumns,
                entityMetadata.parentEntityMetadata,
                parentPrimaryColumns,
                "CASCADE"
            );
            entityMetadata.ownColumns.push(...parentIdColumns);
            entityMetadata.foreignKeys.push(foreignKey);
        });*/

        entityMetadatas.forEach(entityMetadata => {

            // create entity's relations join columns
            entityMetadata.relations.filter(relation => relation.isOneToOne || relation.isManyToOne).forEach(relation => {

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

                const joinColumnArgsArray = storage.filterJoinColumns(relation.target, relation.propertyName);

                const hasAnyReferencedColumnName = joinColumnArgsArray.find(joinColumnArgs => !!joinColumnArgs.referencedColumnName);
                const manyToOneWithoutJoinColumn = joinColumnArgsArray.length === 0 && relation.isManyToOne;
                const hasJoinColumnWithoutAnyReferencedColumnName = joinColumnArgsArray.length > 0 && !hasAnyReferencedColumnName;
                let columns: ColumnMetadata[], referencedColumns: ColumnMetadata[];

                if (manyToOneWithoutJoinColumn || hasJoinColumnWithoutAnyReferencedColumnName) { // covers case3 and case1
                    referencedColumns = relation.inverseEntityMetadata.primaryColumns;

                } else { // cases with referenced columns defined
                    referencedColumns = joinColumnArgsArray.map(joinColumnArgs => {
                        const referencedColumn = relation.inverseEntityMetadata.ownColumns.find(column => column.propertyName === joinColumnArgs.referencedColumnName); // todo: can we also search in relations?
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

                    let relationalColumn = relation.entityMetadata.ownColumns.find(column => column.givenDatabaseName === joinColumnName);
                    if (!relationalColumn) {
                        relationalColumn = new ColumnMetadata({
                            entityMetadata: entityMetadata,
                            // entityTarget: entityMetadata.target,
                            mode: "virtual",
                            propertyName: joinColumnName!,
                            isPrimary: relation.isPrimary,
                            isNullable: relation.isNullable,
                            type: referencedColumn.type,
                            givenDatabaseName: joinColumnName
                        });
                        relationalColumn.build(this.namingStrategy);
                        entityMetadata.ownColumns.push(relationalColumn);
                        entityMetadata.buildOnColumnsChange();
                    }
                    relationalColumn.relationMetadata = relation;
                    referencedColumn.buildOnRelationChange();
                    return relationalColumn;
                });

                const foreignKey = new ForeignKeyMetadata({
                    entityMetadata: entityMetadata,
                    tableName: entityMetadata.tableName,
                    referencedTableName: relation.inverseEntityMetadata.tableName,
                    name: this.namingStrategy.foreignKeyName(entityMetadata.tableName, columns.map(column => column.databaseName), relation.inverseEntityMetadata.tableName, referencedColumns.map(column => column.databaseName)),
                    columns: columns,
                    columnNames: columns.map(column => column.databaseName),
                    referencedColumnNames: referencedColumns.map(column => column.databaseName),
                    referencedEntityMetadata: relation.inverseEntityMetadata,
                    referencedColumns: referencedColumns,
                    onDelete: relation.onDelete
                });

                relation.foreignKeys.push(foreignKey);
                relation.entityMetadata.foreignKeys.push(foreignKey);
                relation.buildOnForeignKeysChange();
            });
        });

        entityMetadatas.forEach(entityMetadata => {

            // create entity's relations join columns
            entityMetadata.relations.filter(relation => relation.isManyToMany).forEach(relation => {
                const joinTableMetadataArgs = storage.findJoinTable(relation.target, relation.propertyName);
                if (!joinTableMetadataArgs) return;

                const joinTableName = joinTableMetadataArgs.name || this.namingStrategy.joinTableName(
                        relation.entityMetadata.tableNameWithoutPrefix,
                        relation.inverseEntityMetadata.tableNameWithoutPrefix,
                        relation.propertyPath,
                        relation.hasInverseSide ? relation.inverseRelation.propertyName : ""
                    );

                let referencedColumns: ColumnMetadata[];
                const hasAnyReferencedColumnName = joinTableMetadataArgs.joinColumns ? joinTableMetadataArgs.joinColumns.find(joinColumn => !!joinColumn.referencedColumnName) : false;
                if (!joinTableMetadataArgs.joinColumns || (joinTableMetadataArgs.joinColumns && !hasAnyReferencedColumnName)) {
                    referencedColumns = relation.entityMetadata.ownColumns.filter(column => column.isPrimary);
                } else {
                    referencedColumns = joinTableMetadataArgs.joinColumns.map(joinColumn => {
                        const referencedColumn = relation.entityMetadata.ownColumns.find(column => column.propertyName === joinColumn.referencedColumnName);
                        if (!referencedColumn)
                            throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.entityMetadata.name}`);

                        return referencedColumn;
                    });
                }

                let inverseReferencedColumns: ColumnMetadata[];
                const hasInverseJoinColumns = !!joinTableMetadataArgs.inverseJoinColumns;
                const hasAnyInverseReferencedColumnName = hasInverseJoinColumns ? joinTableMetadataArgs.inverseJoinColumns!.find(joinColumn => !!joinColumn.referencedColumnName) : false;
                if (!hasInverseJoinColumns || (hasInverseJoinColumns && !hasAnyInverseReferencedColumnName)) {
                    inverseReferencedColumns = relation.inverseEntityMetadata.primaryColumns;
                } else {
                    inverseReferencedColumns = joinTableMetadataArgs.inverseJoinColumns!.map(joinColumn => {
                        const referencedColumn = relation.inverseEntityMetadata.ownColumns.find(column => column.propertyName === joinColumn.referencedColumnName);
                        if (!referencedColumn)
                            throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`);

                        return referencedColumn;
                    });
                }
                const junctionEntityMetadata = new EntityMetadata({
                    lazyRelationsWrapper: this.lazyRelationsWrapper,
                    isJunction: true,
                    tableType: "junction",
                    givenTableName: joinTableName
                });

                const junctionColumns = referencedColumns.map(referencedColumn => {
                    const joinColumn = joinTableMetadataArgs.joinColumns ? joinTableMetadataArgs.joinColumns.find(joinColumnArgs => {
                        return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === referencedColumn.propertyName) &&
                            !!joinColumnArgs.name;
                    }) : undefined;
                    const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.namingStrategy.joinTableColumnName(relation.entityMetadata.tableNameWithoutPrefix, referencedColumn.propertyName, referencedColumn.givenDatabaseName);

                    return new ColumnMetadata({
                        entityMetadata: junctionEntityMetadata,
                        propertyName: columnName,
                        mode: "virtual",
                        length: referencedColumn.length,
                        type: referencedColumn.type,
                        databaseName: columnName,
                        isNullable: false,
                        isPrimary: true
                    });
                });

                const inverseJunctionColumns = inverseReferencedColumns.map(inverseReferencedColumn => {
                    const joinColumn = joinTableMetadataArgs.inverseJoinColumns ? joinTableMetadataArgs.inverseJoinColumns.find(joinColumnArgs => {
                            return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === inverseReferencedColumn.propertyName) &&
                                !!joinColumnArgs.name;
                        }) : undefined;
                    const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.namingStrategy.joinTableColumnName(relation.inverseEntityMetadata.tableNameWithoutPrefix, inverseReferencedColumn.propertyName, inverseReferencedColumn.givenDatabaseName);

                    return new ColumnMetadata({
                        entityMetadata: junctionEntityMetadata,
                        propertyName: columnName,
                        mode: "virtual",
                        length: inverseReferencedColumn.length,
                        type: inverseReferencedColumn.type,
                        databaseName: columnName,
                        isNullable: false,
                        isPrimary: true
                    });
                });

                junctionEntityMetadata.foreignKeys = [
                    new ForeignKeyMetadataBuilder(junctionEntityMetadata, junctionColumns, relation.entityMetadata, referencedColumns),
                    new ForeignKeyMetadataBuilder(junctionEntityMetadata, inverseJunctionColumns, relation.inverseEntityMetadata, inverseReferencedColumns)
                ];

                junctionColumns.concat(inverseJunctionColumns).forEach(column => column.relationMetadata = relation);
                junctionEntityMetadata.ownColumns = junctionColumns.concat(inverseJunctionColumns);
                junctionEntityMetadata.indices = [ // todo: shall we remove indices?
                    new IndexMetadata({
                        entityMetadata: junctionEntityMetadata,
                        columns: junctionColumns.map(column => column.databaseName),
                        isUnique: false
                    }),
                    new IndexMetadata({
                        entityMetadata: junctionEntityMetadata,
                        columns: inverseJunctionColumns.map(column => column.databaseName),
                        isUnique: false
                    })
                ];

                relation.foreignKeys = junctionEntityMetadata.foreignKeys;
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.hasInverseSide)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;

                entityMetadatas.push(junctionEntityMetadata);
                relation.buildOnForeignKeysChange();
                junctionEntityMetadata.build(entityMetadatas, this.namingStrategy, this.driver.options.tablesPrefix);
            });

        });

        // generate keys for tables with single-table inheritance
        entityMetadatas.forEach(metadata => {
            if (metadata.inheritanceType !== "single-table" || !metadata.discriminatorColumn)
                return;

            const indexForKey = new IndexMetadata({
                entityMetadata: metadata,
                target: metadata.target,
                columns: [metadata.discriminatorColumn.databaseName],
                isUnique: false
            });
            metadata.indices.push(indexForKey);

            const indexForKeyWithPrimary = new IndexMetadata({
                entityMetadata: metadata,
                target: metadata.target,
                columns: [metadata.firstPrimaryColumn.propertyName, metadata.discriminatorColumn.propertyName],
                isUnique: false
            });
            metadata.indices.push(indexForKeyWithPrimary);
        });

        // generate junction tables for all closure tables
        entityMetadatas.forEach(entityMetadata => {
            if (!entityMetadata.isClosure)
                return;

            if (entityMetadata.primaryColumns.length > 1) // todo: fix multiple primary keys support
                throw new Error(`Cannot use given entity ${entityMetadata.name} as a closure table, because it have multiple primary keys. Entities with multiple primary keys are not supported in closure tables.`);

            const closureJunctionEntityMetadata = new EntityMetadata({
                lazyRelationsWrapper: this.lazyRelationsWrapper,
                isJunction: true,
                tableType: "closure-junction",
                parentClosureEntityMetadata: entityMetadata
            });

            const columns = [
                new ColumnMetadata({
                    entityMetadata: closureJunctionEntityMetadata,
                    propertyName: "__virtual__", // check how property name is used
                    mode: "virtual",
                    length: entityMetadata.firstPrimaryColumn.length,
                    type: entityMetadata.firstPrimaryColumn.type,
                    databaseName: "ancestor"
                }),
                new ColumnMetadata({
                    entityMetadata: closureJunctionEntityMetadata,
                    propertyName: "__virtual__", // check how property name is used
                    mode: "virtual",
                    length: entityMetadata.firstPrimaryColumn.length,
                    type: entityMetadata.firstPrimaryColumn.type,
                    databaseName: "descendant"
                })
            ];

            if (entityMetadata.treeLevelColumn) {
                columns.push(new ColumnMetadata({
                    entityMetadata: closureJunctionEntityMetadata,
                    propertyName: "__virtual__", // check how property name is used
                    mode: "virtual",
                    type: ColumnTypes.INTEGER,
                    databaseName: "level"
                }));
            }

            closureJunctionEntityMetadata.ownColumns = columns;
            closureJunctionEntityMetadata.foreignKeys = [
                new ForeignKeyMetadata({
                    entityMetadata: closureJunctionEntityMetadata,
                    referencedEntityMetadata: entityMetadata,
                    columns: [columns[0]],
                    referencedColumns: entityMetadata.primaryColumns
                }),
                new ForeignKeyMetadata({
                    entityMetadata: closureJunctionEntityMetadata,
                    referencedEntityMetadata: entityMetadata,
                    columns: [columns[1]],
                    referencedColumns: entityMetadata.primaryColumns
                }),
            ];

            entityMetadata.closureJunctionTable = closureJunctionEntityMetadata;
            entityMetadatas.push(closureJunctionEntityMetadata);
            closureJunctionEntityMetadata.build(entityMetadatas, this.namingStrategy, this.driver.options.tablesPrefix);
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

    /*protected createEntityMetadata(metadata: EntityMetadata, options: {
        userSpecifiedTableName?: string,
        closureOwnerTableName?: string,
    }) {

        const tableNameUserSpecified = options.userSpecifiedTableName;
        const isClosureJunction = metadata.tableType === "closure-junction";
        const targetName = metadata.target instanceof Function ? (metadata.target as any).name : metadata.target;
        const tableNameWithoutPrefix = isClosureJunction
            ? this.namingStrategy.closureJunctionTableName(options.closureOwnerTableName!)
            : this.namingStrategy.tableName(targetName, options.userSpecifiedTableName);

        const tableName = this.namingStrategy.prefixTableName(this.driver.options.tablesPrefix, tableNameWithoutPrefix);

        // for virtual tables (like junction table) target is equal to undefined at this moment
        // we change this by setting virtual's table name to a target name
        // todo: add validation so targets with same schema names won't conflicts with virtual table names
        metadata.target = metadata.target ? metadata.target : tableName;
        metadata.targetName = targetName;
        metadata.givenTableName = tableNameUserSpecified;
        metadata.tableNameWithoutPrefix = tableNameWithoutPrefix;
        metadata.tableName = tableName;
        metadata.name = targetName ? targetName : tableName;
        // metadata.namingStrategy = this.namingStrategy;
    }*/

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