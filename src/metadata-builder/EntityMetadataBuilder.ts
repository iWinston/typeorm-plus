import {getFromContainer} from "../index";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ColumnOptions} from "../decorator/options/ColumnOptions";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
import {EntityMetadataValidator} from "./EntityMetadataValidator";
import {IndexMetadata} from "../metadata/IndexMetadata";
import {JoinColumnMetadata} from "../metadata/JoinColumnMetadata";
import {TableMetadata} from "../metadata/TableMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {JoinTableMetadata} from "../metadata/JoinTableMetadata";
import {JunctionEntityMetadataBuilder} from "./JunctionEntityMetadataBuilder";
import {ClosureJunctionEntityMetadataBuilder} from "./ClosureJunctionEntityMetadataBuilder";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {MetadataArgsStorage} from "../metadata-args/MetadataArgsStorage";
import {JoinColumnMetadataArgs} from "../metadata-args/JoinColumnMetadataArgs";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";
import {Driver} from "../driver/Driver";
import {EmbeddedMetadataArgs} from "../metadata-args/EmbeddedMetadataArgs";
import {RelationIdMetadata} from "../metadata/RelationIdMetadata";
import {RelationCountMetadata} from "../metadata/RelationCountMetadata";

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

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(driver: Driver,
                  lazyRelationsWrapper: LazyRelationsWrapper,
                  metadataArgsStorage: MetadataArgsStorage,
                  namingStrategy: NamingStrategyInterface,
                  entityClasses?: Function[]): EntityMetadata[] {
        const embeddableMergedArgs = metadataArgsStorage.getMergedEmbeddableTableMetadatas(entityClasses);
        const entityMetadatas: EntityMetadata[] = [];
        const allMergedArgs = metadataArgsStorage.getMergedTableMetadatas(entityClasses);
        allMergedArgs.forEach(mergedArgs => {

            const tables = [mergedArgs.table].concat(mergedArgs.children);
            tables.forEach(tableArgs => {

                // find embeddable tables for embeddeds registered in this table and create EmbeddedMetadatas from them
                const findEmbeddedsRecursively = (embeddedArgs: EmbeddedMetadataArgs[]) => {
                    const embeddeds: EmbeddedMetadata[] = [];
                    embeddedArgs.forEach(embedded => {
                        const embeddableTable = embeddableMergedArgs.find(embeddedMergedArgs => embeddedMergedArgs.table.target === embedded.type());
                        if (embeddableTable) {
                            const table = new TableMetadata(embeddableTable.table);
                            const columns = embeddableTable.columns.toArray().map(args => new ColumnMetadata(args));
                            const subEmbeddeds = findEmbeddedsRecursively(embeddableTable.embeddeds.toArray());
                            embeddeds.push(new EmbeddedMetadata(table, columns, subEmbeddeds, embedded));
                        }
                    });
                    return embeddeds;
                };
                const embeddeds = findEmbeddedsRecursively(mergedArgs.embeddeds.toArray());

                // create metadatas from args
                const argsForTable = mergedArgs.inheritance && mergedArgs.inheritance.type === "single-table" ? mergedArgs.table : tableArgs;

                const table = new TableMetadata(argsForTable);
                const columns = mergedArgs.columns.toArray().map(args => {

                    // if column's target is a child table then this column should have all nullable columns
                    if (mergedArgs.inheritance &&
                        mergedArgs.inheritance.type === "single-table" &&
                        args.target !== mergedArgs.table.target && !!mergedArgs.children.find(childTable => childTable.target === args.target)) {
                        args.options.nullable = true;
                    }
                    return new ColumnMetadata(args);
                });
                const relations = mergedArgs.relations.toArray().map(args => new RelationMetadata(args));
                const relationIds = mergedArgs.relationIds.toArray().map(args => new RelationIdMetadata(args));
                const relationCounts = mergedArgs.relationCounts.toArray().map(args => new RelationCountMetadata(args));
                const indices = mergedArgs.indices.toArray().map(args => new IndexMetadata(args));
                const discriminatorValueArgs = mergedArgs.discriminatorValues.find(discriminatorValueArgs => {
                    return discriminatorValueArgs.target === tableArgs.target;
                });
                // create a new entity metadata
                const entityMetadata = new EntityMetadata({
                    junction: false,
                    target: tableArgs.target,
                    tablesPrefix: driver.options.tablesPrefix,
                    namingStrategy: namingStrategy,
                    tableMetadata: table,
                    columnMetadatas: columns,
                    relationMetadatas: relations,
                    relationIdMetadatas: relationIds,
                    relationCountMetadatas: relationCounts,
                    indexMetadatas: indices,
                    embeddedMetadatas: embeddeds,
                    inheritanceType: mergedArgs.inheritance ? mergedArgs.inheritance.type : undefined,
                    discriminatorValue: discriminatorValueArgs ? discriminatorValueArgs.value : (tableArgs.target as any).name // todo: pass this to naming strategy to generate a name
                }, lazyRelationsWrapper);
                entityMetadatas.push(entityMetadata);
                // create entity's relations join tables

                // add lazy initializer for entity relations
                if (entityMetadata.target instanceof Function) {
                    entityMetadata.relations
                        .filter(relation => relation.isLazy)
                        .forEach(relation => {
                            lazyRelationsWrapper.wrap((entityMetadata.target as Function).prototype, relation);
                        });
                }
            });
        });

        // after all metadatas created we set inverse side (related) entity metadatas for all relation metadatas
        entityMetadatas.forEach(entityMetadata => {
            entityMetadata.relations.forEach(relation => {
                const inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type || (typeof relation.type === "string" && m.targetName === relation.type));
                if (!inverseEntityMetadata)
                    throw new Error("Entity metadata for " + entityMetadata.name + "#" + relation.propertyName + " was not found.");

                relation.inverseEntityMetadata = inverseEntityMetadata;
            });
        });

        // after all metadatas created we set parent entity metadata for class-table inheritance
        entityMetadatas.forEach(entityMetadata => {
            const mergedArgs = allMergedArgs.find(mergedArgs => {
                return mergedArgs.table.target === entityMetadata.target;
            });
            if (mergedArgs && mergedArgs.parent) {
                const parentEntityMetadata = entityMetadatas.find(entityMetadata => entityMetadata.table.target === (mergedArgs!.parent! as any).target); // todo: weird compiler error here, thats why type casing is used
                if (parentEntityMetadata)
                    entityMetadata.parentEntityMetadata = parentEntityMetadata;
            }
        });

        // generate virtual column with foreign key for class-table inheritance
        entityMetadatas
            .filter(metadata => !!metadata.parentEntityMetadata)
            .forEach(metadata => {
                const parentEntityMetadataPrimaryColumn = metadata.parentEntityMetadata.firstPrimaryColumn; // todo: make sure to create columns for all its primary columns
                const columnName = namingStrategy.classTableInheritanceParentColumnName(metadata.parentEntityMetadata.table.name, parentEntityMetadataPrimaryColumn.propertyName);
                const parentRelationColumn = new ColumnMetadata({
                    target: metadata.parentEntityMetadata.table.target,
                    propertyName: parentEntityMetadataPrimaryColumn.propertyName,
                    // propertyType: parentEntityMetadataPrimaryColumn.propertyType,
                    mode: "parentId",
                    options: <ColumnOptions> {
                        name: columnName,
                        type: parentEntityMetadataPrimaryColumn.type,
                        unique: true,
                        nullable: false,
                        primary: false
                    }
                });

                // add column
                metadata.addColumn(parentRelationColumn);

                // add foreign key
                const foreignKey = new ForeignKeyMetadata(
                    [parentRelationColumn],
                    metadata.parentEntityMetadata.table,
                    [parentEntityMetadataPrimaryColumn],
                    "CASCADE"
                );
                foreignKey.entityMetadata = metadata;
                metadata.foreignKeys.push(foreignKey);
            });

        entityMetadatas.forEach(entityMetadata => {
            const mergedArgs = allMergedArgs.find(mergedArgs => {
                return mergedArgs.table.target === entityMetadata.target;
            });
            if (!mergedArgs) return;

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

                    const joinColumnArgsArray = mergedArgs.joinColumns.filterByProperty(relation.propertyName);

                    const hasAnyReferencedColumnName = joinColumnArgsArray.find(joinColumnArgs => !!joinColumnArgs.referencedColumnName);
                    const manyToOneWithoutJoinColumn = joinColumnArgsArray.length === 0 && relation.isManyToOne;
                    const hasJoinColumnWithoutAnyReferencedColumnName = joinColumnArgsArray.length > 0 && !hasAnyReferencedColumnName;
                    let columns: ColumnMetadata[], referencedColumns: ColumnMetadata[];

                    if (manyToOneWithoutJoinColumn || hasJoinColumnWithoutAnyReferencedColumnName) { // covers case3 and case1
                        referencedColumns = relation.inverseEntityMetadata.primaryColumnsWithParentIdColumns;
                    } else { // cases with referenced columns defined
                        referencedColumns = joinColumnArgsArray.map(joinColumnArgs => {
                            const referencedColumn = relation.inverseEntityMetadata.columns.find(column => column.fullName === joinColumnArgs.referencedColumnName);
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
                        const joinColumnName = joinColumnMetadataArg ? joinColumnMetadataArg.name : namingStrategy.joinColumnName(relation.propertyName, referencedColumn.propertyName);

                        let relationalColumn = relation.entityMetadata.columns.find(column => column.fullName === joinColumnName);
                        if (!relationalColumn) {
                            relationalColumn = new ColumnMetadata({
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
                        columns,
                        relation.inverseEntityMetadata.table,
                        referencedColumns,
                        relation.onDelete
                    );

                    foreignKey.entityMetadata = relation.entityMetadata;
                    relation.foreignKey = foreignKey;
                    relation.entityMetadata.foreignKeys.push(foreignKey);
                });
        });

        entityMetadatas.forEach(entityMetadata => {
            const mergedArgs = allMergedArgs.find(mergedArgs => {
                return mergedArgs.table.target === entityMetadata.target;
            });
            if (!mergedArgs) return;

            // create entity's relations join columns
            entityMetadata.manyToManyRelations.forEach(relation => {
                const joinTableMetadataArgs = mergedArgs.joinTables.findByProperty(relation.propertyName);
                if (!joinTableMetadataArgs) return;

                if (joinTableMetadataArgs) {
                    const joinTable = new JoinTableMetadata();
                    joinTable.target = joinTableMetadataArgs.target;
                    joinTable.propertyName = joinTableMetadataArgs.propertyName;

                    joinTable.joinColumns = this.createJoinColumns(
                        joinTableMetadataArgs.joinColumns || [],
                        relation.entityMetadata.primaryColumnsWithParentIdColumns,
                        relation.entityMetadata.allColumns,
                        relation,
                        (columnName => namingStrategy.joinTableColumnName(relation.entityMetadata.table.nameWithoutPrefix, columnName))
                    );
                    joinTable.inverseJoinColumns = this.createJoinColumns(
                        joinTableMetadataArgs.inverseJoinColumns || [],
                        relation.inverseEntityMetadata.primaryColumnsWithParentIdColumns,
                        relation.inverseEntityMetadata.allColumns,
                        relation,
                        (columnName => namingStrategy.joinTableColumnName(relation.inverseEntityMetadata.table.nameWithoutPrefix, columnName))
                    );

                    joinTable.name = joinTableMetadataArgs.name || relation.entityMetadata.namingStrategy.joinTableName(
                        relation.entityMetadata.table.nameWithoutPrefix,
                        relation.inverseEntityMetadata.table.nameWithoutPrefix,
                        relation.propertyName,
                        relation.hasInverseSide ? relation.inverseRelation.propertyName : "",
                        joinTable.joinColumns.map(joinColumn => joinColumn.referencedColumn.name)
                    );
                    relation.joinTable = joinTable;
                    joinTable.relation = relation;
                }
            });

        });

        // generate keys for tables with single-table inheritance
        entityMetadatas
            .filter(metadata => metadata.inheritanceType === "single-table" && metadata.hasDiscriminatorColumn)
            .forEach(metadata => {
                const indexForKey = new IndexMetadata({
                    target: metadata.target,
                    columns: [metadata.discriminatorColumn.fullName],
                    unique: false
                });
                indexForKey.entityMetadata = metadata;
                metadata.indices.push(indexForKey);

                const indexForKeyWithPrimary = new IndexMetadata({
                    target: metadata.target,
                    columns: [metadata.firstPrimaryColumn.propertyName, metadata.discriminatorColumn.propertyName],
                    unique: false
                });
                indexForKeyWithPrimary.entityMetadata = metadata;
                metadata.indices.push(indexForKeyWithPrimary);
            });

        // generate columns and foreign keys for tables with relations
        /*entityMetadatas.forEach(metadata => {
            metadata.relationsWithJoinColumns.forEach(relation => {
                relation.joinColumns.map(joinColumn => {

                    // find relational column and if it does not exist - add it
                    let relationalColumn = metadata.columns.find(column => column.fullName === joinColumn.name);
                    if (!relationalColumn) {
                        relationalColumn = new ColumnMetadata({
                            target: metadata.target,
                            propertyName: joinColumn.name,
                            mode: "virtual",
                            options: {
                                name: joinColumn.name,
                                type: joinColumn.referencedColumn.type,
                                nullable: relation.isNullable,
                                primary: relation.isPrimary
                            }
                        });
                        relationalColumn.relationMetadata = relation;
                        metadata.addColumn(relationalColumn);
                    }
                });
            });
        });*/

        /*entityMetadatas.forEach(metadata => {
            metadata.relationsWithJoinColumns.forEach(relation => {

                const columns = relation.joinColumns.map(joinColumn => {
                    return metadata.columns.find(column => column.fullName === joinColumn.name)!;
                });

                // create and add foreign key
                const inverseSideColumns = relation.joinColumns.map(joinColumn => joinColumn.referencedColumn!);
                const foreignKey = new ForeignKeyMetadata(
                    columns,
                    relation.inverseEntityMetadata.table,
                    inverseSideColumns,
                    relation.onDelete
                );
                foreignKey.entityMetadata = metadata;
                metadata.foreignKeys.push(foreignKey);
            });
        });*/

        // generate junction tables for all closure tables
        entityMetadatas.forEach(metadata => {
            if (!metadata.table.isClosure)
                return;

            if (metadata.primaryColumns.length > 1)
                throw new Error(`Cannot use given entity ${metadata.name} as a closure table, because it have multiple primary keys. Entities with multiple primary keys are not supported in closure tables.`);

            const closureJunctionEntityMetadata = getFromContainer(ClosureJunctionEntityMetadataBuilder).build(driver, lazyRelationsWrapper, {
                namingStrategy: namingStrategy,
                table: metadata.table,
                primaryColumn: metadata.firstPrimaryColumn,
                hasTreeLevelColumn: metadata.hasTreeLevelColumn
            });
            metadata.closureJunctionTable = closureJunctionEntityMetadata;
            entityMetadatas.push(closureJunctionEntityMetadata);
        });

        // generate junction tables for all many-to-many tables
        entityMetadatas.forEach(metadata => {
            metadata.ownerManyToManyRelations.forEach(relation => {
                const junctionEntityMetadata = getFromContainer(JunctionEntityMetadataBuilder).build(driver, lazyRelationsWrapper, {
                    namingStrategy: namingStrategy,
                    firstTable: metadata.table,
                    secondTable: relation.inverseEntityMetadata.table,
                    joinTable: relation.joinTable
                });
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.hasInverseSide)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;

                entityMetadatas.push(junctionEntityMetadata);
            });
        });

        // check for errors in a built metadata schema (we need to check after relationEntityMetadata is set)
        getFromContainer(EntityMetadataValidator).validateMany(entityMetadatas);

        return entityMetadatas;
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private createJoinColumns(joinColumnArgsArray: JoinColumnMetadataArgs[],
                              primaryColumns: ColumnMetadata[],
                              columnMetadatas: ColumnMetadata[],
                              relation: RelationMetadata,
                              columnNameFactory: (columnName: string) => string): JoinColumnMetadata[] {

        const hasAnyReferencedColumnName = joinColumnArgsArray.find(joinColumnArgs => !!joinColumnArgs.referencedColumnName);
        const createColumns = (joinColumnArgsArray.length === 0 && relation.isManyToOne) ||
            (joinColumnArgsArray.length > 0 && !hasAnyReferencedColumnName) ||
            (relation.isManyToMany && !hasAnyReferencedColumnName);

        if (createColumns) { // covers case3 and case1

            joinColumnArgsArray = primaryColumns.map(primaryColumn => {

                // in the case if relation has join column with only name set we need this check
                const joinColumnMetadataArg = joinColumnArgsArray.find(joinColumnArgs => !joinColumnArgs.referencedColumnName && !!joinColumnArgs.name);
                return {
                    target: relation.entityMetadata.target,
                    propertyName: relation.propertyName,
                    referencedColumnName: primaryColumn.propertyName,
                    name: joinColumnMetadataArg ? joinColumnMetadataArg.name : undefined
                };
            });
        }

        return joinColumnArgsArray.map(joinColumnMetadataArgs => {
            const joinColumn = new JoinColumnMetadata();
            joinColumn.relation = relation;
            joinColumn.target = joinColumnMetadataArgs.target;
            joinColumn.propertyName = joinColumnMetadataArgs.propertyName;
            const referencedColumn = columnMetadatas.find(column => {
                return column.propertyName === joinColumnMetadataArgs.referencedColumnName;
            });
            if (!referencedColumn)
                throw new Error(`Referenced column ${joinColumnMetadataArgs.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`); // todo: fix  ${relation.inverseEntityMetadata.name}

            joinColumn.referencedColumn = referencedColumn;
            joinColumn.name = joinColumnMetadataArgs.name || columnNameFactory(joinColumn.referencedColumn.propertyName);
            return joinColumn;
        });
    }

}