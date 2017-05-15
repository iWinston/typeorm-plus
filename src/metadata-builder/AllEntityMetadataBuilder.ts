import {EntityMetadata} from "../metadata/EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {ForeignKeyMetadata} from "../metadata/ForeignKeyMetadata";
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
import {MetadataArgsUtils} from "../metadata-args/MetadataArgsUtils";

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

    /**
     * Builds a complete metadata aggregations for the given entity classes.
     */
    build(entityClasses?: Function[]): EntityMetadata[] {

        const allTables = entityClasses ? this.metadataArgsStorage.filterTables(entityClasses) : this.metadataArgsStorage.tables.toArray();

        // filter out table metadata args for those we really create entity metadatas and tables in the db
        const realTables = allTables.filter(table => table.type === "regular" || table.type === "closure" || table.type === "class-table-child");

        const entityMetadatas: EntityMetadata[] = realTables.map(tableArgs => {
            const inheritanceTree = tableArgs.target instanceof Function ? MetadataArgsUtils.getInheritanceTree(tableArgs.target) : [tableArgs.target]; // todo: implement later here inheritance for string-targets

            // collect all table embeddeds
            const entityMetadata = new EntityMetadata({
                namingStrategy: this.namingStrategy,
                lazyRelationsWrapper: this.lazyRelationsWrapper,
                tablesPrefix: this.driver.options.tablesPrefix,
                args: tableArgs
            });
            entityMetadata.embeddeds = this.createEmbeddedsRecursively(entityMetadata, this.metadataArgsStorage.filterEmbeddeds(inheritanceTree));

            entityMetadata.ownColumns = this.metadataArgsStorage.filterColumns(inheritanceTree).map(args => {
                return new ColumnMetadata({ entityMetadata, args });
            });
            entityMetadata.ownRelations = this.metadataArgsStorage.filterRelations(inheritanceTree).map(args => {
                return new RelationMetadata({ entityMetadata, args });
            });
            entityMetadata.relationIds = this.metadataArgsStorage.filterRelationIds(inheritanceTree).map(args => {
                return new RelationIdMetadata({ entityMetadata, args });
            });
            entityMetadata.relationCounts = this.metadataArgsStorage.filterRelationCounts(inheritanceTree).map(args => {
                return new RelationCountMetadata({ entityMetadata, args });
            });
            entityMetadata.indices = this.metadataArgsStorage.filterIndices(inheritanceTree).map(args => {
                return new IndexMetadata({ entityMetadata, args });
            });
            return entityMetadata;
        });

        // calculate entity metadata computed properties and all its sub-metadatas
        entityMetadatas.forEach(entityMetadata => this.buildEntityMetadata(entityMetadata));

        // calculate entity metadata computed properties and all its sub-metadatas
        entityMetadatas.forEach(entityMetadata => this.buildInverseProperties(entityMetadata, entityMetadatas));

        entityMetadatas.forEach(entityMetadata => {

            // create entity's relations join columns
            entityMetadata.relations.filter(relation => relation.isOneToOne || relation.isManyToOne).forEach(relation => {
                const foreignKey = this.createJoinColumnRelationForeignKey(relation);
                if (!foreignKey) return; // this case is possible only for one-to-one non owning side
                foreignKey.build(this.namingStrategy);
                relation.foreignKeys.push(foreignKey);
                entityMetadata.foreignKeys.push(foreignKey);
                relation.buildOnForeignKeysChange();
            });

            // create junction entity metadatas for entity many-to-many relations
            entityMetadata.relations.filter(relation => relation.isManyToMany).forEach(relation => {
                const joinTableMetadataArgs = this.metadataArgsStorage.findJoinTable(relation.target, relation.propertyName);
                if (!joinTableMetadataArgs) return; // no join table set - no need to do anything

                const referencedColumns = this.collectRelationReferencedColumns(relation);
                const inverseReferencedColumns = this.collectRelationInverseReferencedColumns(relation);
                const junctionEntityMetadata = this.createJunctionEntityMetadata(relation, referencedColumns, inverseReferencedColumns);

                relation.foreignKeys = junctionEntityMetadata.foreignKeys;
                relation.buildOnForeignKeysChange();
                relation.junctionEntityMetadata = junctionEntityMetadata;
                if (relation.hasInverseSide)
                    relation.inverseRelation.junctionEntityMetadata = junctionEntityMetadata;

                entityMetadatas.push(junctionEntityMetadata);
                this.buildEntityMetadata(junctionEntityMetadata);
                this.buildInverseProperties(junctionEntityMetadata, entityMetadatas);
            });

        });

        // generate keys for tables with single-table inheritance
        entityMetadatas
            .filter(metadata => metadata.inheritanceType === "single-table")
            .forEach(entityMetadata => this.createKeysForTableInheritance(entityMetadata));

        // generate junction tables for all closure tables
        entityMetadatas
            .filter(metadata => metadata.isClosure)
            .forEach(entityMetadata => {
                const closureJunctionEntityMetadata = this.createClosureJunctionEntityMetadata(entityMetadata);
                entityMetadata.closureJunctionTable = closureJunctionEntityMetadata;
                this.buildEntityMetadata(closureJunctionEntityMetadata);
                this.buildInverseProperties(closureJunctionEntityMetadata, entityMetadatas);
                entityMetadatas.push(closureJunctionEntityMetadata);
            });

        // add lazy initializer for entity relations
        entityMetadatas
            .filter(metadata => metadata.target instanceof Function)
            .forEach(entityMetadata => {
                entityMetadata.relations
                    .filter(relation => relation.isLazy)
                    .forEach(relation => {
                        this.lazyRelationsWrapper.wrap((entityMetadata.target as Function).prototype, relation);
                    });
            });

        entityMetadatas.forEach(metadata => {
            metadata.relations.forEach(relation => relation.buildOnForeignKeysChange());
            metadata.buildOnRelationsChange();
        });

        return entityMetadatas;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected createJunctionEntityMetadata(relation: RelationMetadata, referencedColumns: ColumnMetadata[], inverseReferencedColumns: ColumnMetadata[]) {
        const joinTableMetadataArgs = this.metadataArgsStorage.findJoinTable(relation.target, relation.propertyName)!;

        const joinTableName = joinTableMetadataArgs.name || this.namingStrategy.joinTableName(
                relation.entityMetadata.tableNameWithoutPrefix,
                relation.inverseEntityMetadata.tableNameWithoutPrefix,
                relation.propertyPath,
                relation.hasInverseSide ? relation.inverseRelation.propertyName : ""
            );

        const junctionEntityMetadata = new EntityMetadata({
            lazyRelationsWrapper: this.lazyRelationsWrapper,
            namingStrategy: this.namingStrategy,
            tablesPrefix: this.driver.options.tablesPrefix,
            args: {
                target: "",
                name: joinTableName,
                type: "junction"
            }
        });
        const junctionColumns = referencedColumns.map(referencedColumn => {
            const joinColumn = joinTableMetadataArgs.joinColumns ? joinTableMetadataArgs.joinColumns.find(joinColumnArgs => {
                return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === referencedColumn.propertyName) &&
                    !!joinColumnArgs.name;
            }) : undefined;
            const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.namingStrategy.joinTableColumnName(relation.entityMetadata.tableNameWithoutPrefix, referencedColumn.propertyName, referencedColumn.givenDatabaseName);

            return new ColumnMetadata({
                entityMetadata: junctionEntityMetadata,
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
            const joinColumn = joinTableMetadataArgs.inverseJoinColumns ? joinTableMetadataArgs.inverseJoinColumns.find(joinColumnArgs => {
                return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === inverseReferencedColumn.propertyName) &&
                    !!joinColumnArgs.name;
            }) : undefined;
            const columnName = joinColumn && joinColumn.name ? joinColumn.name : this.namingStrategy.joinTableColumnName(relation.inverseEntityMetadata.tableNameWithoutPrefix, inverseReferencedColumn.propertyName, inverseReferencedColumn.givenDatabaseName);

            return new ColumnMetadata({
                entityMetadata: junctionEntityMetadata,
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

        junctionEntityMetadata.foreignKeys = [
            new ForeignKeyMetadata({
                entityMetadata: junctionEntityMetadata,
                referencedEntityMetadata: relation.entityMetadata,
                columns: junctionColumns,
                referencedColumns: referencedColumns
            }),
            new ForeignKeyMetadata({
                entityMetadata: junctionEntityMetadata,
                referencedEntityMetadata: relation.inverseEntityMetadata,
                columns: inverseJunctionColumns,
                referencedColumns: inverseReferencedColumns
            }),
        ];

        junctionColumns.concat(inverseJunctionColumns).forEach(column => column.relationMetadata = relation);
        junctionEntityMetadata.ownColumns = junctionColumns.concat(inverseJunctionColumns);
        junctionEntityMetadata.indices = [
            new IndexMetadata({
                entityMetadata: junctionEntityMetadata,
                columns: junctionColumns,
                args: {
                    target: "",
                    unique: false
                }
            }),

            new IndexMetadata({
                entityMetadata: junctionEntityMetadata,
                columns: inverseJunctionColumns,
                args: {
                    target: "",
                    unique: false
                }
            })
        ];

        return junctionEntityMetadata;
    }

    protected createClosureJunctionEntityMetadata(parentClosureEntityMetadata: EntityMetadata): EntityMetadata {
        const entityMetadata = new EntityMetadata({
            parentClosureEntityMetadata: parentClosureEntityMetadata,
            lazyRelationsWrapper: this.lazyRelationsWrapper,
            namingStrategy: this.namingStrategy,
            tablesPrefix: this.driver.options.tablesPrefix,
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

    protected createEmbeddedsRecursively(entityMetadata: EntityMetadata, embeddedArgs: EmbeddedMetadataArgs[]): EmbeddedMetadata[] {
        return embeddedArgs.map(embeddedArgs => {
            const embeddedMetadata = new EmbeddedMetadata({ entityMetadata: entityMetadata, args: embeddedArgs });
            embeddedMetadata.columns = this.metadataArgsStorage.filterColumns(embeddedMetadata.type).map(args => {
                return new ColumnMetadata({ entityMetadata, embeddedMetadata, args});
            });
            embeddedMetadata.relations = this.metadataArgsStorage.filterRelations(embeddedMetadata.type).map(args => {
                return new RelationMetadata({ entityMetadata, embeddedMetadata, args });
            });
            embeddedMetadata.embeddeds = this.createEmbeddedsRecursively(entityMetadata, this.metadataArgsStorage.filterEmbeddeds(embeddedMetadata.type));
            embeddedMetadata.embeddeds.forEach(subEmbedded => subEmbedded.parentEmbeddedMetadata = embeddedMetadata);
            return embeddedMetadata;
        });
    }

    protected createJoinColumnRelationForeignKey(relation: RelationMetadata): ForeignKeyMetadata|undefined {
        const referencedColumns = this.collectRelationReferencedColumns(relation);
        if (!referencedColumns.length)
            return undefined; // this case is possible only for one-to-one non owning side

        const columns = this.collectRelationColumns(relation, referencedColumns);
        return new ForeignKeyMetadata({
            entityMetadata: relation.entityMetadata,
            referencedEntityMetadata: relation.inverseEntityMetadata,
            columns: columns,
            referencedColumns: referencedColumns,
            onDelete: relation.onDelete,
        });
    }

    protected buildEntityMetadata(entityMetadata: EntityMetadata) {

        // first build all embeddeds, because all columns and relations including owning by embedded depend on embeds
        entityMetadata.embeddeds.forEach(embedded => embedded.build(this.namingStrategy));
        entityMetadata.embeddeds.forEach(embedded => {
            embedded.columnsFromTree.forEach(column => column.build(this.namingStrategy));
            embedded.relationsFromTree.forEach(relation => relation.build(this.namingStrategy));
        });
        entityMetadata.ownColumns.forEach(column => column.build(this.namingStrategy));
        entityMetadata.ownRelations.forEach(relation => relation.build(this.namingStrategy));

        entityMetadata.buildOnRelationsChange();

        entityMetadata.relations = entityMetadata.embeddeds.reduce((relations, embedded) => relations.concat(embedded.relationsFromTree), entityMetadata.ownRelations);
        entityMetadata.oneToOneRelations = entityMetadata.relations.filter(relation => relation.isOneToOne);
        entityMetadata.oneToManyRelations = entityMetadata.relations.filter(relation => relation.isOneToMany);
        entityMetadata.manyToOneRelations = entityMetadata.relations.filter(relation => relation.isManyToOne);
        entityMetadata.manyToManyRelations = entityMetadata.relations.filter(relation => relation.isManyToMany);
        entityMetadata.ownerOneToOneRelations = entityMetadata.relations.filter(relation => relation.isOneToOneOwner);
        entityMetadata.ownerManyToManyRelations = entityMetadata.relations.filter(relation => relation.isManyToManyOwner);
        entityMetadata.treeParentRelation = entityMetadata.relations.find(relation => relation.isTreeParent)!; // todo: fix ! later
        entityMetadata.treeChildrenRelation = entityMetadata.relations.find(relation => relation.isTreeChildren)!; // todo: fix ! later

        entityMetadata.buildOnColumnsChange();
        entityMetadata.generatedColumn = entityMetadata.columns.find(column => column.isGenerated)!; // todo: fix ! later
        entityMetadata.createDateColumn = entityMetadata.columns.find(column => column.mode === "createDate")!; // todo: fix ! later
        entityMetadata.updateDateColumn = entityMetadata.columns.find(column => column.mode === "updateDate")!; // todo: fix ! later
        entityMetadata.versionColumn = entityMetadata.columns.find(column => column.mode === "version")!; // todo: fix ! later
        entityMetadata.discriminatorColumn = entityMetadata.columns.find(column => column.mode === "discriminator")!; // todo: fix ! later
        entityMetadata.treeLevelColumn = entityMetadata.columns.find(column => column.mode === "treeLevel")!; // todo: fix ! later
        entityMetadata.parentIdColumns = entityMetadata.columns.filter(column => column.mode === "parentId")!; // todo: fix ! later
        entityMetadata.objectIdColumn = entityMetadata.columns.find(column => column.mode === "objectId")!; // todo: fix ! later

        entityMetadata.foreignKeys.forEach(foreignKey => foreignKey.build(this.namingStrategy));
        entityMetadata.indices.forEach(index => index.build(this.namingStrategy));
    }

    protected buildInverseProperties(entityMetadata: EntityMetadata, entityMetadatas: EntityMetadata[]) {
        entityMetadata.relations.forEach(relation => {

            // compute inverse side (related) entity metadatas for all relation metadatas
            const inverseEntityMetadata = entityMetadatas.find(m => m.target === relation.type || (typeof relation.type === "string" && m.targetName === relation.type));
            if (!inverseEntityMetadata)
                throw new Error("Entity metadata for " + entityMetadata.name + "#" + relation.propertyPath + " was not found. Check if you specified a correct entity object, check its really entity and its connected in the connection options.");

            relation.inverseEntityMetadata = inverseEntityMetadata;
            relation.inverseSidePropertyPath = relation.buildInverseSidePropertyPath();

            // and compute inverse relation and mark if it has such
            relation.inverseRelation = inverseEntityMetadata.relations.find(foundRelation => foundRelation.propertyPath === relation.inverseSidePropertyPath)!; // todo: remove ! later
            relation.hasInverseSide = !!relation.inverseRelation; // todo: do we really need this flag
        });
    }

    protected createKeysForTableInheritance(entityMetadata: EntityMetadata) {
        const indexForKey = new IndexMetadata({
            entityMetadata: entityMetadata,
            columns: [entityMetadata.discriminatorColumn],
            args: {
                target: entityMetadata.target,
                unique: false
            }
        });
        entityMetadata.indices.push(indexForKey);

        const indexForKeyWithPrimary = new IndexMetadata({
            entityMetadata: entityMetadata,
            columns: [entityMetadata.primaryColumns[0], entityMetadata.discriminatorColumn],
            args: {
                target: entityMetadata.target,
                unique: false
            }
        });
        entityMetadata.indices.push(indexForKeyWithPrimary);
    }

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
    protected collectRelationInverseReferencedColumns(relation: RelationMetadata) {
        const joinTableMetadataArgs = this.metadataArgsStorage.findJoinTable(relation.target, relation.propertyName)!;
        const hasInverseJoinColumns = !!joinTableMetadataArgs.inverseJoinColumns;
        const hasAnyInverseReferencedColumnName = hasInverseJoinColumns ? joinTableMetadataArgs.inverseJoinColumns!.find(joinColumn => !!joinColumn.referencedColumnName) : false;
        if (!hasInverseJoinColumns || (hasInverseJoinColumns && !hasAnyInverseReferencedColumnName)) {
            return relation.inverseEntityMetadata.primaryColumns;
        } else {
            return joinTableMetadataArgs.inverseJoinColumns!.map(joinColumn => {
                const referencedColumn = relation.inverseEntityMetadata.ownColumns.find(column => column.propertyName === joinColumn.referencedColumnName);
                if (!referencedColumn)
                    throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`);

                return referencedColumn;
            });
        }
    }

    protected collectRelationReferencedColumns(relation: RelationMetadata) {
        if (relation.isManyToMany) {
            const joinTableMetadataArgs = this.metadataArgsStorage.findJoinTable(relation.target, relation.propertyName)!;
            const hasAnyReferencedColumnName = joinTableMetadataArgs.joinColumns ? joinTableMetadataArgs.joinColumns.find(joinColumn => !!joinColumn.referencedColumnName) : false;
            if (!joinTableMetadataArgs.joinColumns || (joinTableMetadataArgs.joinColumns && !hasAnyReferencedColumnName)) {
                return relation.entityMetadata.ownColumns.filter(column => column.isPrimary);
            } else {
                return joinTableMetadataArgs.joinColumns.map(joinColumn => {
                    const referencedColumn = relation.entityMetadata.ownColumns.find(column => column.propertyName === joinColumn.referencedColumnName);
                    if (!referencedColumn)
                        throw new Error(`Referenced column ${joinColumn.referencedColumnName} was not found in entity ${relation.entityMetadata.name}`);

                    return referencedColumn;
                });
            }

        } else {
            const joinColumnArgsArray = this.metadataArgsStorage.filterJoinColumns(relation.target, relation.propertyName);
            const hasAnyReferencedColumnName = joinColumnArgsArray.find(joinColumnArgs => !!joinColumnArgs.referencedColumnName);
            const manyToOneWithoutJoinColumn = joinColumnArgsArray.length === 0 && relation.isManyToOne;
            const hasJoinColumnWithoutAnyReferencedColumnName = joinColumnArgsArray.length > 0 && !hasAnyReferencedColumnName;

            if (manyToOneWithoutJoinColumn || hasJoinColumnWithoutAnyReferencedColumnName) { // covers case3 and case1
                return relation.inverseEntityMetadata.primaryColumns;

            } else { // cases with referenced columns defined
                return joinColumnArgsArray.map(joinColumnArgs => {
                    const referencedColumn = relation.inverseEntityMetadata.ownColumns.find(column => column.propertyName === joinColumnArgs.referencedColumnName); // todo: can we also search in relations?
                    if (!referencedColumn)
                        throw new Error(`Referenced column ${joinColumnArgs.referencedColumnName} was not found in entity ${relation.inverseEntityMetadata.name}`);

                    return referencedColumn;
                });
            }
        }
    }

    private collectRelationColumns(relation: RelationMetadata, referencedColumns: ColumnMetadata[]) {
        const joinColumnArgsArray = this.metadataArgsStorage.filterJoinColumns(relation.target, relation.propertyName);
        return referencedColumns.map(referencedColumn => {

            // in the case if relation has join column with only name set we need this check
            const joinColumnMetadataArg = joinColumnArgsArray.find(joinColumnArgs => {
                return (!joinColumnArgs.referencedColumnName || joinColumnArgs.referencedColumnName === referencedColumn.propertyName) &&
                    !!joinColumnArgs.name;
            });
            const joinColumnName = joinColumnMetadataArg ? joinColumnMetadataArg.name : this.namingStrategy.joinColumnName(relation.propertyName, referencedColumn.propertyName);

            let relationalColumn = relation.entityMetadata.ownColumns.find(column => column.databaseName === joinColumnName);
            if (!relationalColumn) {
                relationalColumn = new ColumnMetadata({
                    entityMetadata: relation.entityMetadata,
                    args: {
                        target: "",
                        mode: "virtual",
                        propertyName: joinColumnName!,
                        options: {
                            name: joinColumnName,
                            type: referencedColumn.type,
                            primary: relation.isPrimary,
                            nullable: relation.isNullable,
                        }
                    }
                });
                relationalColumn.build(this.namingStrategy);
                relation.entityMetadata.ownColumns.push(relationalColumn);
                relation.entityMetadata.buildOnColumnsChange();
            }
            relationalColumn.referencedColumn = referencedColumn; // its important to set it here because we need to set referenced column for user defined join column
            relationalColumn.type = referencedColumn.type; // also since types of relational column and join column must be equal we override user defined column type
            relationalColumn.relationMetadata = relation;
            return relationalColumn;
        });
    }
}

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