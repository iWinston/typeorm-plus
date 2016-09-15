import {Alias} from "./alias/Alias";
import {AliasMap} from "./alias/AliasMap";
import {RawSqlResultsToEntityTransformer} from "./transformer/RawSqlResultsToEntityTransformer";
import {Broadcaster} from "../subscriber/Broadcaster";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {Driver} from "../driver/Driver";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../driver/QueryRunner";
import {SqlServerDriver} from "../driver/sqlserver/SqlServerDriver";

export type OrderCondition = { [columnName: string]: "ASC"|"DESC" };

/**
 * @internal
 */
export interface Join {
    alias: Alias;
    type: "LEFT"|"INNER";
    conditionType: "ON"|"WITH";
    condition?: string;
    tableName: string;
    mapToProperty?: string;
    isMappingMany: boolean;
}

export interface JoinRelationId {

    alias: Alias;
    type: "LEFT"|"INNER";
    conditionType: "ON"|"WITH";
    condition?: string;
    mapToProperty?: string;
}

export interface RelationCountMeta {

    alias: Alias;
    // property: string;
    conditionType: "ON"|"WITH";
    condition?: string;
    mapToProperty?: string;
    entities: { entity: any, metadata: EntityMetadata }[];
    // entity?: any;
}

/**
 * @internal
 */
export interface JoinMapping {
    type: "join"|"relationId";
    alias: Alias;
    parentName: string;
    propertyName: string;
    isMany: boolean;
}

export class QueryBuilder<Entity> {

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    private aliasMap: AliasMap;
    private type: "select"|"update"|"delete" = "select";
    private selects: string[] = [];
    private fromEntity: { alias: Alias };
    private fromTableName: string;
    private fromTableAlias: string;
    private updateQuerySet: Object;
    private joins: Join[] = [];
    private joinRelationIds: JoinRelationId[] = [];
    private relationCountMetas: RelationCountMeta[] = [];
    private groupBys: string[] = [];
    private wheres: { type: "simple"|"and"|"or", condition: string }[] = [];
    private havings: { type: "simple"|"and"|"or", condition: string }[] = [];
    private orderBys: { sort: string, order: "ASC"|"DESC" }[] = [];
    private parameters: ObjectLiteral = {};
    private limit: number;
    private offset: number;
    private firstResult: number;
    private maxResults: number;
    private ignoreParentTablesJoins: boolean = false;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private driver: Driver,
                private entityMetadatas: EntityMetadataCollection,
                private broadcaster: Broadcaster,
                private queryRunner?: QueryRunner) {
        this.aliasMap = new AliasMap(entityMetadatas);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get alias(): string {
        return this.aliasMap.mainAlias.name;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    delete(entity?: Function): this;
    delete(tableName?: string): this;
    delete(tableNameOrEntity?: string|Function): this {
        if (tableNameOrEntity instanceof Function) {
            const aliasName = (<any> tableNameOrEntity).name;
            const aliasObj = new Alias(aliasName);
            aliasObj.target = <Function> tableNameOrEntity;
            this.aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };
        } else if (typeof tableNameOrEntity === "string") {
            this.fromTableName = <string> tableNameOrEntity;
        }

        this.type = "delete";
        return this;
    }

    update(updateSet: Object): this;
    update(entity: Function, updateSet: Object): this;
    update(tableName: string, updateSet: Object): this;
    update(tableNameOrEntityOrUpdateSet?: string|Function|Object, maybeUpdateSet?: Object): this {
        const updateSet = maybeUpdateSet ? maybeUpdateSet : <Object> tableNameOrEntityOrUpdateSet;

        if (tableNameOrEntityOrUpdateSet instanceof Function) {
            const aliasName = (<any> tableNameOrEntityOrUpdateSet).name;
            const aliasObj = new Alias(aliasName);
            aliasObj.target = <Function> tableNameOrEntityOrUpdateSet;
            this.aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };

        } else if (typeof tableNameOrEntityOrUpdateSet === "string") {
            this.fromTableName = <string> tableNameOrEntityOrUpdateSet;
        }

        this.type = "update";
        this.updateQuerySet = updateSet;
        return this;
    }

    select(selection?: string): this;
    select(selection?: string[]): this;
    select(...selection: string[]): this;
    select(selection?: string|string[]): this {
        this.type = "select";
        if (selection) {
            if (selection instanceof Array) {
                this.selects = selection;
            } else {
                this.selects = [selection];
            }
        }
        return this;
    }

    addSelect(selection: string): this;
    addSelect(selection: string[]): this;
    addSelect(...selection: string[]): this;
    addSelect(selection: string|string[]): this {
        if (selection instanceof Array)
            this.selects = this.selects.concat(selection);
        else
            this.selects.push(selection);

        return this;
    }

    from(tableName: string, alias: string): this;
    from(entity: Function, alias: string): this;
    from(entity: Function|string, alias: string): this;
    from(entityOrTableName: Function|string, alias: string): this {

        if (entityOrTableName instanceof Function || this.isValueSimpleString(entityOrTableName)) {
            const aliasObj = new Alias(alias);
            aliasObj.target = entityOrTableName;
            this.aliasMap.addMainAlias(aliasObj);
            this.fromEntity = { alias: aliasObj };
        } else { // this is required to perform selection from subquery results
            this.fromTableName = <string> entityOrTableName;
            this.fromTableAlias = alias;
        }
        return this;
    }

    countRelationAndMap(mapProperty: string, property: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {

        const [parentAliasName, parentPropertyName] = property.split(".");
        const alias = parentAliasName + "_" + parentPropertyName + "_relation_count";
        const aliasObj = new Alias(alias);
        this.aliasMap.addAlias(aliasObj);
        aliasObj.parentAliasName = parentAliasName;
        aliasObj.parentPropertyName = parentPropertyName;

        const relationCountMeta: RelationCountMeta = {
            mapToProperty: mapProperty,
            conditionType: conditionType,
            condition: condition,
            alias: aliasObj,
            entities: []
        };
        this.relationCountMetas.push(relationCountMeta);
        if (parameters)
            this.addParameters(parameters);
        return this;
    }

    countRelation(property: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {

        const [parentAliasName, parentPropertyName] = property.split(".");
        const alias = parentAliasName + "_" + parentPropertyName + "_relation_count";

        const aliasObj = new Alias(alias);
        this.aliasMap.addAlias(aliasObj);
        aliasObj.parentAliasName = parentAliasName;
        aliasObj.parentPropertyName = parentPropertyName;

        const relationCountMeta: RelationCountMeta = {
            conditionType: conditionType,
            condition: condition,
            alias: aliasObj,
            entities: []
        };
        this.relationCountMetas.push(relationCountMeta);
        if (parameters)
            this.addParameters(parameters);
        return this;
    }

    leftJoinRelationIdAndMap(mapToProperty: string, property: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        return this.joinRelationId("INNER", mapToProperty, property, conditionType, condition, parameters);
    }

    innerJoinRelationIdAndMap(mapToProperty: string, property: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        return this.joinRelationId("INNER", mapToProperty, property, conditionType, condition, parameters);
    }

    innerJoinRelationId(property: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this {
        return this.joinRelationId("INNER", undefined, property, conditionType, condition, parameters);
    }

    leftJoinRelationId(property: string, conditionType: "ON"|"WITH" = "ON", condition?: string, parameters?: ObjectLiteral): this {
        return this.joinRelationId("LEFT", undefined, property, conditionType, condition, parameters);
    }

    innerJoinAndMapMany(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoinAndMapMany(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, true);
    }

    innerJoinAndMapOne(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoinAndMapOne(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, false);
    }

    innerJoinAndSelect(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoinAndSelect(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoinAndSelect(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters);
    }

    innerJoin(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoin(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    innerJoin(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        return this.join("INNER", entityOrProperty, alias, conditionType, condition, parameters);
    }

    leftJoinAndMapMany(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapMany(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapMany(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, true);
    }

    leftJoinAndMapOne(mapToProperty: string, property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapOne(mapToProperty: string, entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndMapOne(mapToProperty: string, entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters, mapToProperty, false);
    }

    leftJoinAndSelect(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndSelect(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoinAndSelect(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        this.addSelect(alias);
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters);
    }

    leftJoin(property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoin(entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral): this;
    leftJoin(entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral): this {
        return this.join("LEFT", entityOrProperty, alias, conditionType, condition, parameters);
    }

    where(where: string, parameters?: ObjectLiteral): this {
        this.wheres.push({ type: "simple", condition: where });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    andWhere(where: string, parameters?: ObjectLiteral): this {
        this.wheres.push({ type: "and", condition: where });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    orWhere(where: string, parameters?: ObjectLiteral): this {
        this.wheres.push({ type: "or", condition: where });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    groupBy(groupBy: string): this {
        this.groupBys = [groupBy];
        return this;
    }

    addGroupBy(groupBy: string): this {
        this.groupBys.push(groupBy);
        return this;
    }

    having(having: string, parameters?: ObjectLiteral): this {
        this.havings.push({ type: "simple", condition: having });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    andHaving(having: string, parameters?: ObjectLiteral): this {
        this.havings.push({ type: "and", condition: having });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    orHaving(having: string, parameters?: ObjectLiteral): this {
        this.havings.push({ type: "or", condition: having });
        if (parameters) this.addParameters(parameters);
        return this;
    }

    orderBy(sort: string, order: "ASC"|"DESC" = "ASC"): this {
        this.orderBys = [{ sort: sort, order: order }];
        return this;
    }

    addOrderBy(sort: string, order: "ASC"|"DESC" = "ASC"): this {
        this.orderBys.push({ sort: sort, order: order });
        return this;
    }

    setLimit(limit: number): this {
        this.limit = limit;
        return this;
    }

    setOffset(offset: number): this {
        this.offset = offset;
        return this;
    }

    setFirstResult(firstResult: number): this {
        this.firstResult = firstResult;
        return this;
    }

    setMaxResults(maxResults: number): this {
        this.maxResults = maxResults;
        return this;
    }

    setParameter(key: string, value: any): this {
        this.parameters[key] = value;
        return this;
    }

    setParameters(parameters: ObjectLiteral): this {
        this.parameters = {};
        Object.keys(parameters).forEach(key => this.parameters[key] = parameters[key]);
        return this;
    }

    addParameters(parameters: ObjectLiteral): this {
        Object.keys(parameters).forEach(key => this.parameters[key] = parameters[key]);
        return this;
    }

    getSql(): string {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createJoinRelationIdsExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        [sql] = this.driver.escapeQueryWithParameters(sql, this.parameters);
        return sql;
    }

    getGeneratedQuery(): string {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createJoinRelationIdsExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        return sql;
    }

    getSqlWithParameters(options?: { skipOrderBy?: boolean }): [string, any[]] {
        let sql = this.createSelectExpression();
        sql += this.createJoinExpression();
        sql += this.createJoinRelationIdsExpression();
        sql += this.createWhereExpression();
        sql += this.createGroupByExpression();
        sql += this.createHavingExpression();
        if (!options || !options.skipOrderBy)
            sql += this.createOrderByExpression();
        sql += this.createLimitExpression();
        sql += this.createOffsetExpression();
        return this.driver.escapeQueryWithParameters(sql, this.getParameters());
    }

    getParameters(): ObjectLiteral {
        const parameters: ObjectLiteral = Object.assign({}, this.parameters);

        // add discriminator column parameter if it exist
        const mainMetadata = this.entityMetadatas.findByTarget(this.aliasMap.mainAlias.target);
        if (mainMetadata.hasDiscriminatorColumn)
            parameters["discriminatorColumnValue"] = mainMetadata.discriminatorValue;

        return parameters;
    }

    async execute(): Promise<any> {
        let ownQueryRunner = false;
        let queryRunner = this.queryRunner;
        if (!queryRunner) {
            ownQueryRunner = true;
            queryRunner = await this.driver.createQueryRunner();
        }

        const [sql, parameters] = this.getSqlWithParameters();
        try {
            return queryRunner.query(sql, parameters);

        } finally {
            if (ownQueryRunner)
                await queryRunner.release();
        }
    }

    getScalarResults<T>(): Promise<T[]> {
        return this.execute();
    }

    getSingleScalarResult<T>(): Promise<T> {
        return this.getScalarResults().then(results => results[0]);

    }

    getResults(): Promise<Entity[]> {
        return this.getResultsAndScalarResults().then(results => {
            return results.entities;
        });
    }

    async getResultsAndScalarResults(): Promise<{ entities: Entity[], scalarResults: any[] }> {
        if (!this.aliasMap.hasMainAlias)
            throw new Error(`Alias is not set. Looks like nothing is selected. Use select*, delete, update method to set an alias.`);

        let ownQueryRunner = false;
        let queryRunner = this.queryRunner;
        if (!queryRunner) {
            ownQueryRunner = true;
            queryRunner = await this.driver.createQueryRunner();
        }

        const mainAliasName = this.aliasMap.mainAlias.name;
        let scalarResults: any[];
        if (this.firstResult || this.maxResults) {
            const [sql, parameters] = this.getSqlWithParameters({ skipOrderBy: true });

            const distinctAlias = this.driver.escapeTableName("distinctAlias");
            const metadata = this.entityMetadatas.findByTarget(this.fromEntity.alias.target);
            let idsQuery = `SELECT `;
            idsQuery += metadata.primaryColumns.map((primaryColumn, index) => {
                const propertyName = this.driver.escapeAliasName(mainAliasName + "_" + primaryColumn.name);
                if (index === 0) {
                    return `DISTINCT(${distinctAlias}.${propertyName}) as ids_${primaryColumn.name}`;
                } else {
                    return `${distinctAlias}.${propertyName}) as ids_${primaryColumn.name}`;
                }
            }).join(", ");
            idsQuery += ` FROM (${sql}) ${distinctAlias}`; // TODO: WHAT TO DO WITH PARAMETERS HERE? DO THEY WORK?

            if (this.driver instanceof SqlServerDriver) { // todo: temporary. need to refactor and make a proper abstraction

                if (this.firstResult)
                    idsQuery += ` ORDER BY "ids_${metadata.firstPrimaryColumn.name}" OFFSET ${this.firstResult} ROWS`;
                if (this.maxResults)
                    idsQuery += " FETCH NEXT " + this.maxResults + " ROWS ONLY";
            } else {

                if (this.maxResults)
                    idsQuery += " LIMIT " + this.maxResults;
                if (this.firstResult)
                    idsQuery += " OFFSET " + this.firstResult;
            }

            try {
                return await queryRunner.query(idsQuery, parameters)
                    .then((results: any[]) => {
                        scalarResults = results;
                        if (results.length === 0)
                            return [];

                        let condition = "";
                        const parameters: ObjectLiteral = {};
                        if (metadata.hasMultiplePrimaryKeys) {
                            condition = results.map(result => {
                                return metadata.primaryColumns.map(primaryColumn => {
                                    parameters["ids_" + primaryColumn.propertyName] = result["ids_" + primaryColumn.propertyName];
                                    return mainAliasName + "." + primaryColumn.propertyName + "=:ids_" + primaryColumn.propertyName;
                                }).join(" AND ");
                            }).join(" OR ");
                        } else {
                            parameters["ids"] = results.map(result => result["ids_" + metadata.firstPrimaryColumn.propertyName]);
                            condition = mainAliasName + "." + metadata.firstPrimaryColumn.propertyName + " IN (:ids)";
                        }
                        const [queryWithIdsSql, queryWithIdsParameters] = this.clone({queryRunner: queryRunner})
                            .andWhere(condition, parameters)
                            .getSqlWithParameters();
                        return (queryRunner as QueryRunner).query(queryWithIdsSql, queryWithIdsParameters);
                    })
                    .then(results => {
                        return this.rawResultsToEntities(results);
                    })
                    .then(results => this.broadcaster.broadcastLoadEventsForAll(this.aliasMap.mainAlias.target, results).then(() => results))
                    .then(results => {
                        return {
                            entities: results,
                            scalarResults: scalarResults
                        };
                    });

            } finally {
                if (ownQueryRunner)
                    await queryRunner.release();
            }

        } else {

            const [sql, parameters] = this.getSqlWithParameters();

            try {
                // console.log(sql);
                return await queryRunner.query(sql, parameters)
                    .then(results => {
                        scalarResults = results;
                        return this.rawResultsToEntities(results);
                    })
                    .then(results => {

                        return this.loadRelationCounts(queryRunner as QueryRunner, results)
                            .then(counts => {
                                // console.log("counts: ", counts);
                                return results;
                            });
                    })
                    .then(results => {
                        return this.broadcaster
                            .broadcastLoadEventsForAll(this.aliasMap.mainAlias.target, results)
                            .then(() => results);
                    })
                    .then(results => {
                        return {
                            entities: results,
                            scalarResults: scalarResults
                        };
                    });

            } finally {
                if (ownQueryRunner)
                    await queryRunner.release();
            }
        }
    }

    /*private extractIdMap(alias: Alias, results: Entity[]): { alias: Alias, ids: any[] }[] {

        // console.log("results ids:", results.map(result => result[]));
        const metadata = this.aliasMap.getEntityMetadataByAlias(alias);
        if (!metadata)
            throw new Error("Cannot get entity metadata for the given alias " + this.aliasMap.mainAlias.name);

        /!*
        results.forEach(result => {
        });

        metadata.relations.forEach(relation => {
            this.aliasMap.
        });
        *!/
    }*/

    private loadRelationCounts(queryRunner: QueryRunner, results: Entity[]): Promise<{}> {

        const promises = this.relationCountMetas.map(relationCountMeta => {
            const parentAlias = relationCountMeta.alias.parentAliasName;
            const foundAlias = this.aliasMap.findAliasByName(parentAlias);
            if (!foundAlias)
                throw new Error(`Alias "${parentAlias}" was not found`);

            const parentMetadata = this.aliasMap.getEntityMetadataByAlias(foundAlias);
            if (!parentMetadata)
                throw new Error("Cannot get entity metadata for the given alias " + foundAlias.name);

            const relation = parentMetadata.findRelationWithPropertyName(relationCountMeta.alias.parentPropertyName);

            const queryBuilder: QueryBuilder<any> = new (this.constructor as any)(this.driver, this.entityMetadatas, this.broadcaster, queryRunner);
            let condition = "";

            const metadata = this.aliasMap.getEntityMetadataByAlias(relationCountMeta.alias);
            if (!metadata)
                throw new Error("Cannot get entity metadata for the given alias " + relationCountMeta.alias.name);

            let joinTableName: string = metadata.table.name;

            const junctionMetadata = relation.junctionEntityMetadata;
            const appendedCondition = relationCountMeta.condition ? " AND " + this.replacePropertyNames(relationCountMeta.condition) : "";

            /*if (relation.isManyToMany) {
                const junctionTable = junctionMetadata.table.name;
                const junctionAlias = relationCountMeta.alias.parentAliasName + "_" + relationCountMeta.alias.name;
                const joinAlias = relationCountMeta.alias.name;
                const joinTable = relation.isOwning ? relation.joinTable : relation.inverseRelation.joinTable; // not sure if this is correct
                const joinTableColumn = joinTable.referencedColumn.name; // not sure if this is correct
                const inverseJoinColumnName = joinTable.inverseReferencedColumn.name; // not sure if this is correct

                let condition1 = "", condition2 = "";
                if (relation.isOwning) {
                    condition1 = junctionAlias + "." + junctionMetadata.columns[0].name + "=" + parentAlias + "." + joinTableColumn;
                    condition2 = joinAlias + "." + inverseJoinColumnName + "=" + junctionAlias + "." + junctionMetadata.columns[1].name;
                } else {
                    condition1 = junctionAlias + "." + junctionMetadata.columns[1].name + "=" + parentAlias + "." + joinTableColumn;
                    condition2 = joinAlias + "." + inverseJoinColumnName + "=" + junctionAlias + "." + junctionMetadata.columns[0].name;
                }

                condition = " LEFT JOIN " + junctionTable + " " + junctionAlias + " " + relationCountMeta.conditionType + " " + condition1 +
                    " LEFT JOIN " + joinTableName + " " + joinAlias + " " + relationCountMeta.conditionType + " " + condition2 + appendedCondition;

            } else if (relation.isManyToOne || (relation.isOneToOne && relation.isOwning)) {
                const joinTableColumn = relation.joinColumn.referencedColumn.name;
                const condition2 = relationCountMeta.alias.name + "." + joinTableColumn + "=" + parentAlias + "." + relation.name;
                condition = " LEFT JOIN " + joinTableName + " " + relationCountMeta.alias.name + " " + relationCountMeta.conditionType + " " + condition2 + appendedCondition;

            } else {
                throw new Error(`Relation count can be applied only `); // this should be done on entity build
            }*/

            // if (relationCountMeta.condition)
            //     condition += relationCountMeta.condition;
            // relationCountMeta.alias.target;
            // todo: FIX primaryColumn usages

            const ids = relationCountMeta.entities
                .map(entityWithMetadata => entityWithMetadata.metadata.getEntityIdMap(entityWithMetadata.entity))
                .filter(idMap => idMap !== undefined)
                .map(idMap => idMap![parentMetadata.primaryColumn.propertyName]);
            if (!ids || !ids.length)
                throw new Error(`No ids found to load relation counters`);

            return queryBuilder
                .select(`${parentMetadata.name + "." + parentMetadata.primaryColumn.propertyName} AS id`)
                .addSelect(`COUNT(${ this.driver.escapeAliasName(relation.propertyName) + "." + this.driver.escapeColumnName(relation.inverseEntityMetadata.primaryColumn.name) }) as cnt`)
                .from(parentMetadata.target, parentMetadata.name)
                .leftJoin(parentMetadata.name + "." + relation.propertyName, relation.propertyName, relationCountMeta.conditionType, relationCountMeta.condition)
                .setParameters(this.parameters)
                .where(`${parentMetadata.name + "." + parentMetadata.primaryColumn.propertyName} IN (:relationCountIds)`, { relationCountIds: ids })
                .groupBy(parentMetadata.name + "." + parentMetadata.primaryColumn.propertyName)
                .getScalarResults()
                .then((results: { id: any, cnt: any }[]) => {
                    // console.log(relationCountMeta.entities);
                    relationCountMeta.entities.forEach(entityWithMetadata => {
                        const entityId = entityWithMetadata.entity[entityWithMetadata.metadata.primaryColumn.propertyName];
                        const entityResult = results.find(result => {
                            return entityId === this.driver.prepareHydratedValue(result.id, entityWithMetadata.metadata.primaryColumn);
                        });
                        if (entityResult) {

                            if (relationCountMeta.mapToProperty) {
                                const [parentName, propertyName] = (relationCountMeta.mapToProperty as string).split(".");
                                // todo: right now mapping is working only on the currently countRelation class, but
                                // different properties are working. make different classes to work too
                                entityWithMetadata.entity[propertyName] = parseInt(entityResult.cnt);

                            } else if (relation.countField) {
                                entityWithMetadata.entity[relation.countField] = parseInt(entityResult.cnt);
                            }
                        }
                    });
                });
        });

        return Promise.all(promises);
    }


    getSingleResult(): Promise<Entity> {
        return this.getResults().then(entities => entities[0]);
    }

    async getCount(): Promise<number> {

        let ownQueryRunner = false;
        let queryRunner = this.queryRunner;
        if (!queryRunner) {
            ownQueryRunner = true;
            queryRunner = await this.driver.createQueryRunner();
        }

        const mainAlias = this.aliasMap.mainAlias.name;
        const metadata = this.entityMetadatas.findByTarget(this.fromEntity.alias.target);

        const distinctAlias = this.driver.escapeAliasName(mainAlias);
        let countSql = `COUNT(` + metadata.primaryColumnsWithParentIdColumns.map((primaryColumn, index) => {
            const propertyName = this.driver.escapeColumnName(primaryColumn.name);
            if (index === 0) {
                return `DISTINCT(${distinctAlias}.${propertyName})`;
            } else {
                return `${distinctAlias}.${propertyName})`;
            }
        }).join(", ") + ") as cnt";

        const countQuery = this
            .clone({ queryRunner: queryRunner, skipOrderBys: true, ignoreParentTablesJoins: true })
            .select(countSql);

        const [countQuerySql, countQueryParameters] = countQuery.getSqlWithParameters();

        try {
            const results = await queryRunner.query(countQuerySql, countQueryParameters);
            if (!results || !results[0] || !results[0]["cnt"])
                return 0;

            return parseInt(results[0]["cnt"]);

        } finally {
            if (ownQueryRunner)
                await queryRunner.release();
        }
    }

    getResultsAndCount(): Promise<[Entity[], number]> {
        // todo: share database connection and counter
        return Promise.all<any>([
            this.getResults(),
            this.getCount()
        ]);
    }

    clone(options?: { queryRunner?: QueryRunner, skipOrderBys?: boolean, skipLimit?: boolean, skipOffset?: boolean, ignoreParentTablesJoins?: boolean }): QueryBuilder<Entity> {
        const qb = new QueryBuilder(this.driver, this.entityMetadatas, this.broadcaster, options ? options.queryRunner : undefined);
        if (options && options.ignoreParentTablesJoins)
            qb.ignoreParentTablesJoins = options.ignoreParentTablesJoins;

        switch (this.type) {
            case "select":
                qb.select(this.selects);
                break;
            case "update":
                qb.update(this.updateQuerySet);
                break;
            case "delete":
                qb.delete();
                break;
        }

        if (this.fromEntity && this.fromEntity.alias && this.fromEntity.alias.target) {
            qb.from(this.fromEntity.alias.target, this.fromEntity.alias.name);
        } else if (this.fromTableName) {
            qb.from(this.fromTableName, this.fromTableAlias);
        }

        this.joins.forEach(join => {
            const property = join.tableName || join.alias.target || (join.alias.parentAliasName + "." + join.alias.parentPropertyName);
            qb.join(join.type, property, join.alias.name, join.conditionType, join.condition || "", undefined, join.mapToProperty, join.isMappingMany);
        });

        this.groupBys.forEach(groupBy => qb.addGroupBy(groupBy));

        this.wheres.forEach(where => {
            switch (where.type) {
                case "simple":
                    qb.where(where.condition);
                    break;
                case "and":
                    qb.andWhere(where.condition);
                    break;
                case "or":
                    qb.orWhere(where.condition);
                    break;
            }
        });

        this.havings.forEach(having => {
            switch (having.type) {
                case "simple":
                    qb.having(having.condition);
                    break;
                case "and":
                    qb.andHaving(having.condition);
                    break;
                case "or":
                    qb.orHaving(having.condition);
                    break;
            }
        });

        if (!options || !options.skipOrderBys)
            this.orderBys.forEach(orderBy => qb.addOrderBy(orderBy.sort, orderBy.order));

        Object.keys(this.parameters).forEach(key => qb.setParameter(key, this.parameters[key]));

        if (!options || !options.skipLimit)
            qb.setLimit(this.limit);

        if (!options || !options.skipOffset)
            qb.setOffset(this.offset);

        qb.setFirstResult(this.firstResult)
            .setMaxResults(this.maxResults);

        return qb;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected rawResultsToEntities(results: any[]) {
        const transformer = new RawSqlResultsToEntityTransformer(this.driver, this.aliasMap, this.extractJoinMappings(), this.relationCountMetas);
        return transformer.transform(results);
    }

    protected createSelectExpression() {
        // todo throw exception if selects or from is missing

        let alias: string = "", tableName: string;
        const allSelects: string[] = [];

        if (this.fromTableName) {
            tableName = this.fromTableName;
            alias = this.fromTableAlias;
            // console.log("ALIAS F:", alias);

        } else if (this.fromEntity) {
            const metadata = this.aliasMap.getEntityMetadataByAlias(this.fromEntity.alias);
            if (!metadata)
                throw new Error("Cannot get entity metadata for the given alias " + this.fromEntity.alias.name);
            tableName = metadata.table.name;
            alias = this.fromEntity.alias.name;
            // console.log("ALIAS N:", this.fromEntity.alias);
            // console.log("ALIAS N:", alias);

            // add select from the main table
            if (this.selects.indexOf(alias) !== -1) {
                metadata.columns.forEach(column => {
                    allSelects.push(this.driver.escapeAliasName(alias) + "." + this.driver.escapeColumnName(column.name) + " AS " + this.driver.escapeAliasName(alias + "_" + column.name));
                });
            }

        } else {
            throw new Error("No from given");
        }

        // add selects from joins
        this.joins
            .filter(join => this.selects.indexOf(join.alias.name) !== -1)
            .forEach(join => {
                const joinMetadata = this.aliasMap.getEntityMetadataByAlias(join.alias);
                if (joinMetadata) {
                    joinMetadata.columns.forEach(column => {
                        allSelects.push(this.driver.escapeAliasName(join.alias.name) + "." + this.driver.escapeColumnName(column.name) + " AS " + this.driver.escapeAliasName(join.alias.name + "_" + column.name));
                    });
                } else {
                    allSelects.push(this.driver.escapeAliasName(join.alias.name));
                }
            });

        if (!this.ignoreParentTablesJoins) {
            const metadata = this.entityMetadatas.findByTarget(this.aliasMap.mainAlias.target);
            if (metadata.parentEntityMetadata && metadata.parentIdColumns) {
                const alias = "parentIdColumn_" + this.driver.escapeAliasName(metadata.parentEntityMetadata.table.name);
                metadata.parentEntityMetadata.columns.forEach(column => {
                    allSelects.push(alias + "." + this.driver.escapeColumnName(column.name) + " AS " + alias + "_" + this.driver.escapeAliasName(column.name));
                });
            }
        }

        // add selects from relation id joins
        this.joinRelationIds.forEach(join => {
            // const joinMetadata = this.aliasMap.getEntityMetadataByAlias(join.alias);

            const parentAlias = join.alias.parentAliasName;
            const foundAlias = this.aliasMap.findAliasByName(parentAlias);
            if (!foundAlias)
                throw new Error(`Alias "${parentAlias}" was not found`);

            const parentMetadata = this.aliasMap.getEntityMetadataByAlias(foundAlias);
            if (!parentMetadata)
                throw new Error("Cannot get entity metadata for the given alias " + foundAlias.name);
            const relation = parentMetadata.findRelationWithPropertyName(join.alias.parentPropertyName);
            const junctionMetadata = relation.junctionEntityMetadata;
            // const junctionTable = junctionMetadata.table.name;

            junctionMetadata.columns.forEach(column => {
                allSelects.push(this.driver.escapeAliasName(join.alias.name) + "." + this.driver.escapeColumnName(column.name) + " AS " + this.driver.escapeAliasName(join.alias.name + "_" + column.name));
            });
        });

        // add all other selects
        this.selects.filter(select => {
            return select !== alias && !this.joins.find(join => join.alias.name === select);
        }).forEach(select => allSelects.push(this.replacePropertyNames(select)));

        // if still selection is empty, then simply set it to all (*)
        if (allSelects.length === 0)
            allSelects.push("*");

        // create a selection query
        switch (this.type) {
            case "select":
                return "SELECT " + allSelects.join(", ") + " FROM " + this.driver.escapeTableName(tableName) + " " + this.driver.escapeAliasName(alias);
            case "delete":
                return "DELETE " + (alias ? this.driver.escapeAliasName(alias) : "") + " FROM " + this.driver.escapeTableName(tableName) + " " + (alias ? this.driver.escapeAliasName(alias) : "");
            case "update":
                const updateSet = Object.keys(this.updateQuerySet).map(key => key + "=:updateQuerySet_" + key);
                const params = Object.keys(this.updateQuerySet).reduce((object, key) => {
                    // todo: map propertyNames to names ?
                    (<any> object)["updateQuerySet_" + key] = (<any> this.updateQuerySet)[key];
                    return object;
                }, {});
                this.addParameters(params);
                return "UPDATE " + tableName + " " + (alias ? this.driver.escapeAliasName(alias) : "") + " SET " + updateSet;
        }

        throw new Error("No query builder type is specified.");
    }

    protected createWhereExpression() {

        const conditions = this.wheres.map((where, index) => {
            switch (where.type) {
                case "and":
                    return (index > 0 ? "AND " : "") + this.replacePropertyNames(where.condition);
                case "or":
                    return (index > 0 ? "OR " : "") + this.replacePropertyNames(where.condition);
                default:
                    return this.replacePropertyNames(where.condition);
            }
        }).join(" ");

        const mainMetadata = this.entityMetadatas.findByTarget(this.aliasMap.mainAlias.target);
        if (mainMetadata.hasDiscriminatorColumn)
            return ` WHERE ${ conditions.length ? "(" + conditions + ")" : "" } AND ${mainMetadata.discriminatorColumn.name}=:discriminatorColumnValue`;

        if (!conditions.length) return "";
        return " WHERE " + conditions;
    }

    /**
     * Replaces all entity's propertyName to name in the given statement.
     */
    private replacePropertyNames(statement: string) {
        this.aliasMap.aliases.forEach(alias => {
            const metadata = this.aliasMap.getEntityMetadataByAlias(alias);
            if (!metadata) return;
            metadata.embeddeds.forEach(embedded => {
                embedded.columns.forEach(column => {
                    const expression = alias.name + "." + embedded.propertyName + "." + column.propertyName + "([ =]|.{0}$)";
                    statement = statement.replace(new RegExp(expression, "gm"), this.driver.escapeAliasName(alias.name) + "." + this.driver.escapeColumnName(column.name) + "$1");
                });
            });
            metadata.columns.forEach(column => {
                const expression = alias.name + "." + column.propertyName + "([ =]|.{0}$)";
                statement = statement.replace(new RegExp(expression, "gm"), this.driver.escapeAliasName(alias.name) + "." + this.driver.escapeColumnName(column.name) + "$1");
            });
            metadata.relationsWithJoinColumns.forEach(relation => {
                const expression = alias.name + "." + relation.propertyName + "([ =]|.{0}$)";
                statement = statement.replace(new RegExp(expression, "gm"), this.driver.escapeAliasName(alias.name) + "." + this.driver.escapeColumnName(relation.name) + "$1");
            });
        });
        return statement;
    }

    protected createJoinRelationIdsExpression() {
        return this.joinRelationIds.map(join => {
            const parentAlias = join.alias.parentAliasName;
            const foundAlias = this.aliasMap.findAliasByName(parentAlias);
            if (!foundAlias)
                throw new Error(`Alias "${parentAlias}" was not found`);

            const parentMetadata = this.aliasMap.getEntityMetadataByAlias(foundAlias);
            if (!parentMetadata)
                throw new Error("Cannot get entity metadata for the given alias " + foundAlias.name);

            const relation = parentMetadata.findRelationWithPropertyName(join.alias.parentPropertyName);
            const junctionMetadata = relation.junctionEntityMetadata;
            const junctionTable = junctionMetadata.table.name;
            const junctionAlias = join.alias.name;
            const joinTable = relation.isOwning ? relation.joinTable : relation.inverseRelation.joinTable; // not sure if this is correct
            const joinTableColumn = joinTable.referencedColumn.name; // not sure if this is correct

            let condition1 = "";
            if (relation.isOwning) {
                condition1 = this.driver.escapeAliasName(junctionAlias) + "." + this.driver.escapeColumnName(junctionMetadata.columns[0].name) + "=" + this.driver.escapeAliasName(parentAlias) + "." + this.driver.escapeColumnName(joinTableColumn);
                // condition2 = joinAlias + "." + inverseJoinColumnName + "=" + junctionAlias + "." + junctionMetadata.columns[1].name;
            } else {
                condition1 = this.driver.escapeAliasName(junctionAlias) + "." + this.driver.escapeColumnName(junctionMetadata.columns[1].name) + "=" + this.driver.escapeAliasName(parentAlias) + "." + this.driver.escapeColumnName(joinTableColumn);
                // condition2 = joinAlias + "." + inverseJoinColumnName + "=" + junctionAlias + "." + junctionMetadata.columns[0].name;
            }

            return " " + join.type + " JOIN " + junctionTable + " " + this.driver.escapeAliasName(junctionAlias) + " " + join.conditionType + " " + condition1;
                // " " + joinType + " JOIN " + joinTableName + " " + joinAlias + " " + join.conditionType + " " + condition2 + appendedCondition;
            // console.log(join);
            // return " " + join.type + " JOIN " + joinTableName + " " + join.alias.name + " " + (join.condition ? (join.conditionType + " " + join.condition) : "");
        });
    }

    protected createJoinExpression() {
        let joins = this.joins.map(join => {
            const joinType = join.type; // === "INNER" ? "INNER" : "LEFT";
            let joinTableName: string = join.tableName;
            if (!joinTableName) {
                const metadata = this.aliasMap.getEntityMetadataByAlias(join.alias);
                if (!metadata)
                    throw new Error("Cannot get entity metadata for the given alias " + join.alias.name);

                joinTableName = metadata.table.name;
            }

            const parentAlias = join.alias.parentAliasName;
            if (!parentAlias) {
                return " " + joinType + " JOIN " + this.driver.escapeTableName(joinTableName) + " " + this.driver.escapeAliasName(join.alias.name) + " " + (join.condition ? ( join.conditionType + " " + this.replacePropertyNames(join.condition) ) : "");
            }

            const foundAlias = this.aliasMap.findAliasByName(parentAlias);
            if (!foundAlias)
                throw new Error(`Alias "${parentAlias}" was not found`);

            const parentMetadata = this.aliasMap.getEntityMetadataByAlias(foundAlias);
            if (!parentMetadata)
                throw new Error("Cannot get entity metadata for the given alias " + foundAlias.name);

            const relation = parentMetadata.findRelationWithPropertyName(join.alias.parentPropertyName);
            const junctionMetadata = relation.junctionEntityMetadata;
            const appendedCondition = join.condition ? " AND " + this.replacePropertyNames(join.condition) : "";

            if (relation.isManyToMany) {
                const junctionTable = junctionMetadata.table.name;
                const junctionAlias = join.alias.parentAliasName + "_" + join.alias.name;
                const joinAlias = join.alias.name;
                const joinTable = relation.isOwning ? relation.joinTable : relation.inverseRelation.joinTable; // not sure if this is correct
                const joinTableColumn = joinTable.referencedColumn.name; // not sure if this is correct
                const inverseJoinColumnName = joinTable.inverseReferencedColumn.name; // not sure if this is correct

                let condition1 = "", condition2 = "";
                if (relation.isOwning) {
                    condition1 = this.driver.escapeAliasName(junctionAlias) + "." + this.driver.escapeColumnName(junctionMetadata.columns[0].name) + "=" + this.driver.escapeAliasName(parentAlias) + "." + this.driver.escapeColumnName(joinTableColumn);
                    condition2 = this.driver.escapeAliasName(joinAlias) + "." + this.driver.escapeColumnName(inverseJoinColumnName) + "=" + this.driver.escapeAliasName(junctionAlias) + "." + this.driver.escapeColumnName(junctionMetadata.columns[1].name);
                } else {
                    condition1 = this.driver.escapeAliasName(junctionAlias) + "." + this.driver.escapeColumnName(junctionMetadata.columns[1].name) + "=" + this.driver.escapeAliasName(parentAlias) + "." + this.driver.escapeColumnName(joinTableColumn);
                    condition2 = this.driver.escapeAliasName(joinAlias) + "." + this.driver.escapeColumnName(inverseJoinColumnName) + "=" + this.driver.escapeAliasName(junctionAlias) + "." + this.driver.escapeColumnName(junctionMetadata.columns[0].name);
                }

                return " " + joinType + " JOIN " + this.driver.escapeTableName(junctionTable) + " " + this.driver.escapeAliasName(junctionAlias) + " " + join.conditionType + " " + condition1 +
                       " " + joinType + " JOIN " + this.driver.escapeTableName(joinTableName) + " " + this.driver.escapeAliasName(joinAlias) + " " + join.conditionType + " " + condition2 + appendedCondition;

            } else if (relation.isManyToOne || (relation.isOneToOne && relation.isOwning)) {
                const joinTableColumn = relation.joinColumn.referencedColumn.name;
                const condition = this.driver.escapeAliasName(join.alias.name) + "." + this.driver.escapeColumnName(joinTableColumn) + "=" + this.driver.escapeAliasName(parentAlias) + "." + this.driver.escapeColumnName(relation.name);
                return " " + joinType + " JOIN " + this.driver.escapeTableName(joinTableName) + " " + this.driver.escapeAliasName(join.alias.name) + " " + join.conditionType + " " + condition + appendedCondition;

            } else if (relation.isOneToMany || (relation.isOneToOne && !relation.isOwning)) {
                const joinTableColumn = relation.inverseRelation.joinColumn.referencedColumn.name;
                const condition = this.driver.escapeAliasName(join.alias.name) + "." + this.driver.escapeColumnName(relation.inverseRelation.name) + "=" + this.driver.escapeAliasName(parentAlias) + "." + this.driver.escapeColumnName(joinTableColumn);
                return " " + joinType + " JOIN " + this.driver.escapeTableName(joinTableName) + " " + this.driver.escapeAliasName(join.alias.name) + " " + join.conditionType + " " + condition + appendedCondition;

            } else {
                throw new Error("Unexpected relation type"); // this should not be possible
            }
        }).join(" ");

        if (!this.ignoreParentTablesJoins) {
            const metadata = this.entityMetadatas.findByTarget(this.aliasMap.mainAlias.target);
            if (metadata.parentEntityMetadata && metadata.parentIdColumns) {
                const alias = this.driver.escapeAliasName("parentIdColumn_" + metadata.parentEntityMetadata.table.name);
                joins += " JOIN " + this.driver.escapeTableName(metadata.parentEntityMetadata.table.name)
                    + " " + alias + " ON ";
                joins += metadata.parentIdColumns.map(parentIdColumn => {
                    return this.aliasMap.mainAlias.name + "." + parentIdColumn.name + "=" + alias + "." + parentIdColumn.propertyName;
                });
            }
        }

        return joins;
    }

    protected createGroupByExpression() {
        if (!this.groupBys || !this.groupBys.length) return "";
        return " GROUP BY " + this.replacePropertyNames(this.groupBys.join(", "));
    }

    protected createHavingExpression() {
        if (!this.havings || !this.havings.length) return "";
        return " HAVING " + this.havings.map(having => {
                switch (having.type) {
                    case "and":
                        return " AND " + this.replacePropertyNames(having.condition);
                    case "or":
                        return " OR " + this.replacePropertyNames(having.condition);
                    default:
                        return " " + this.replacePropertyNames(having.condition);
                }
            }).join(" ");
    }

    protected createOrderByExpression() {

        // if user specified a custom order then apply it
        if (this.orderBys.length)
            return " ORDER BY " + this.orderBys.map(order => this.replacePropertyNames(order.sort) + " " + order.order).join(", ");

        // if table has a default order then apply it
        const metadata = this.entityMetadatas.findByTarget(this.aliasMap.mainAlias.target);
        if (metadata.table.orderBy)
            return " ORDER BY " + Object
                .keys(metadata.table.orderBy)
                .map(key => this.replacePropertyNames(key) + " " + metadata.table.orderBy![key])
                .join(", ");

        return "";
    }

    protected createLimitExpression() {
        if (!this.limit) return "";
        return " LIMIT " + this.limit;
    }

    protected createOffsetExpression() {
        if (!this.offset) return "";
        return " OFFSET " + this.offset;
    }

    private extractJoinMappings(): JoinMapping[] {
        const mappings: JoinMapping[] = [];
        this.joins
            .filter(join => !!join.mapToProperty)
            .forEach(join => {
                const [parentName, propertyName] = (join.mapToProperty as string).split(".");
                mappings.push({
                    type: "join",
                    alias: join.alias,
                    parentName: parentName,
                    propertyName: propertyName,
                    isMany: join.isMappingMany
                } as JoinMapping);
            });

        this.joinRelationIds
            .filter(join => !!join.mapToProperty)
            .forEach(join => {
                const [parentName, propertyName] = (join.mapToProperty as string).split(".");
                mappings.push({
                    type: "relationId",
                    alias: join.alias,
                    parentName: parentName,
                    propertyName: propertyName,
                    isMany: false
                });
        });

        return mappings;
    }

    protected join(joinType: "INNER"|"LEFT", property: string, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral, mapToProperty?: string, isMappingMany?: boolean): this;
    protected join(joinType: "INNER"|"LEFT", entity: Function, alias: string, conditionType?: "ON"|"WITH", condition?: string, parameters?: ObjectLiteral, mapToProperty?: string, isMappingMany?: boolean): this;
    protected join(joinType: "INNER"|"LEFT", entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH", condition: string, parameters?: ObjectLiteral, mapToProperty?: string, isMappingMany?: boolean): this;
    protected join(joinType: "INNER"|"LEFT", entityOrProperty: Function|string, alias: string, conditionType: "ON"|"WITH" = "ON", condition: string = "", parameters?: ObjectLiteral, mapToProperty?: string, isMappingMany: boolean = false): this {

        let tableName = "";
        const aliasObj = new Alias(alias);
        this.aliasMap.addAlias(aliasObj);
        if (entityOrProperty instanceof Function) {
            aliasObj.target = entityOrProperty;

        } else if (this.isPropertyAlias(entityOrProperty)) {
            [aliasObj.parentAliasName, aliasObj.parentPropertyName] = entityOrProperty.split(".");

        } else if (typeof entityOrProperty === "string") {
            tableName = entityOrProperty;
            if (!mapToProperty)
                mapToProperty = entityOrProperty;
        }

        const join: Join = { type: joinType, alias: aliasObj, tableName: tableName, conditionType: conditionType, condition: condition, mapToProperty: mapToProperty, isMappingMany: isMappingMany };
        this.joins.push(join);
        if (parameters) this.addParameters(parameters);
        return this;
    }

    protected joinRelationId(joinType: "LEFT"|"INNER", mapToProperty: string|undefined, property: string, conditionType: "ON"|"WITH" = "ON", condition?: string, parameters?: ObjectLiteral): this {

        if (!this.isPropertyAlias(property))
            throw new Error("Only entity relations are allowed in the leftJoinRelationId operation"); // todo: also check if that relation really has entityId

        const [parentAliasName, parentPropertyName] = property.split(".");
        const alias = parentAliasName + "_" + parentPropertyName + "_relation_id";

        const aliasObj = new Alias(alias);
        this.aliasMap.addAlias(aliasObj);
        aliasObj.parentAliasName = parentAliasName;
        aliasObj.parentPropertyName = parentPropertyName;

        this.joinRelationIds.push({
            type: joinType,
            mapToProperty: mapToProperty,
            alias: aliasObj,
            conditionType: conditionType,
            condition: condition
        });
        if (parameters)
            this.addParameters(parameters);

        return this;
    }

    private isValueSimpleString(str: any) {
        return /^[A-Za-z0-9_-]+$/.test(str);
    }

    private isPropertyAlias(str: any): str is string {
        if (!(typeof str === "string"))
            return false;
        if (str.indexOf(".") === -1)
            return false;

        const aliasName = str.split(".")[0];
        const propertyName = str.split(".")[1];

        if (!aliasName || !propertyName)
            return false;

        const aliasNameRegexp = /^[a-zA-Z0-9_-]+$/;
        const propertyNameRegexp = aliasNameRegexp;
        if (!aliasNameRegexp.test(aliasName) || !propertyNameRegexp.test(propertyName))
            return false;

        return true;
    }

}
