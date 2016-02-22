import {Connection} from "../../connection/Connection";
import {CascadeOption, DynamicCascadeOptions} from "./../cascade/CascadeOption";
import {DbObjectColumnValidator} from "./DbObjectColumnValidator";
import {ColumnTypeNotSupportedError} from "../../../odmhelpers/error/ColumnTypeNotSupportedError";
import {PersistOperation} from "../../../odmhelpers/operation/PersistOperation";
import {CascadeOptionUtils} from "../cascade/CascadeOptionUtils";
import {InverseSideUpdateOperation} from "../../../odmhelpers/operation/InverseSideUpdateOperation";
import {EntityMetadata} from "../../metadata-builder/metadata/EntityMetadata";
import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";

/**
 * Makes a transformation of a given entity to the entity that can be saved to the db.
 */
export class EntityToDbObjectTransformer {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connection: Connection;
    private _persistOperations: PersistOperation[];
    private _postPersistOperations: Function[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    get postPersistOperations() {
        return this._postPersistOperations;
    }

    get persistOperations() {
        return this._persistOperations;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Transforms given entity into object that can be persisted into the db.
     */
    transform(metadata: EntityMetadata,
              entity: any,
              cascadeOptionsInCallback?: DynamicCascadeOptions<any>): Object {

        this._persistOperations = [];
        this._postPersistOperations = [];
        return this.entityToDbObject(0, metadata, entity, cascadeOptionsInCallback);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private entityToDbObject(deepness: number,
                             metadata: EntityMetadata,
                             entity: any,
                             cascadeOptionsInCallback?: DynamicCascadeOptions<any>): Object {

        const cascadeOptions = CascadeOptionUtils.prepareCascadeOptions(metadata, cascadeOptionsInCallback);
        const dbObject = {};

        //
        if (metadata.createDateColumn && !metadata.getEntityId(entity))
            entity[metadata.createDateColumn.propertyName] = new Date();
        if (metadata.updateDateColumn)
            entity[metadata.updateDateColumn.propertyName] = new Date();

        //
        Object.keys(entity).forEach(propertyName => {
            const cascadeOption = CascadeOptionUtils.find(cascadeOptions, propertyName);

            if (metadata.hasColumnWithPropertyName(propertyName))
                this.parseColumn(metadata, dbObject, entity, propertyName);

            if (metadata.hasRelationWithOneWithPropertyName(propertyName))
                this.parseRelationWithOne(deepness, metadata, dbObject, entity, propertyName, cascadeOption);

            if (metadata.hasRelationWithManyWithPropertyName(propertyName))
                this.parseRelationWithMany(deepness, metadata, dbObject, entity, propertyName, cascadeOption);

        });
        return dbObject;
    }

    private parseColumn(metadata: EntityMetadata, dbObject: any, entity: any, propertyName: string) {
        const column = metadata.findColumnWithPropertyName(propertyName);
        dbObject[column.name] = entity[propertyName];
    }

    private parseRelationWithOne(deepness: number,
                                 metadata: EntityMetadata,
                                 dbObject: any,
                                 entity: any,
                                 columnName: any,
                                 cascadeOption?: CascadeOption) {

        const relation = metadata.findRelationWithOneByPropertyName(columnName);
        const addFunction = (id: any) => dbObject[relation.name] = id;
        this.parseRelation(deepness, metadata, entity, relation, entity[columnName], addFunction, cascadeOption);
    }


    private parseRelationWithMany(  deepness: number,
                                    metadata: EntityMetadata,
                                    dbObject: any,
                                    entity: any,
                                    columnName: any,
                                    cascadeOption?: CascadeOption) {

        const relation = metadata.findRelationWithManyByPropertyName(columnName);
        const addFunction = (id: any) => dbObject[relation.name].push(id);

        dbObject[relation.name] = [];
        entity[columnName].forEach((columnItem: any) => {
            this.parseRelation(deepness, metadata, entity, relation, columnItem, addFunction, cascadeOption);
        });
    }

    private parseRelation(deepness: number,
                          metadata: EntityMetadata,
                          entity: any,
                          relation: RelationMetadata,
                          value: any,
                          addFunction: (objectId: any) => void,
                          cascadeOption?: CascadeOption) {

        const relationTypeMetadata = this.connection.getMetadata(relation.type);
        const relatedEntityId = value ? relationTypeMetadata.getEntityId(value) : null;

        if (relatedEntityId && !CascadeOptionUtils.isCascadeUpdate(relation, cascadeOption)) {
            addFunction(this.createObjectId(relatedEntityId, relationTypeMetadata));

        } else if (value) {
            // check if we already added this object for persist (can happen when object of the same instance is used in different places)
            let operationOnThisValue = this._persistOperations.reduce((found, operation) => operation.entity === value ? operation : found, null);
            let subCascades = cascadeOption ? cascadeOption.cascades : undefined;
            let relatedDbObject = this.entityToDbObject(deepness + 1, relationTypeMetadata, value, subCascades);
            let doPersist = CascadeOptionUtils.isCascadePersist(relation, cascadeOption);

            let afterExecution = (insertedRelationEntity: any) => {
                let id = relationTypeMetadata.getEntityId(insertedRelationEntity);
                addFunction(this.createObjectId(id, relationTypeMetadata));
                const inverseSideRelationMetadata = relationTypeMetadata.findRelationByPropertyName(relation.inverseSideProperty);
                return <InverseSideUpdateOperation> {
                    inverseSideEntityId: id,
                    inverseSideEntityMetadata: relationTypeMetadata,
                    inverseSideEntityRelation: inverseSideRelationMetadata,
                    entityMetadata: metadata,
                    getEntityId: () => metadata.getEntityId(entity)
                };
            };

            if (!operationOnThisValue) {
                operationOnThisValue = <PersistOperation> {
                    allowedPersist: false,
                    deepness: deepness,
                    entity: value,
                    metadata: relationTypeMetadata,
                    dbObject: relatedDbObject,
                    afterExecution: []
                };
                this._persistOperations.push(operationOnThisValue);
            }

            // this check is required because we check
            operationOnThisValue.afterExecution.push(afterExecution);
            operationOnThisValue.allowedPersist = operationOnThisValue.allowedPersist || doPersist;
        }
    }

    private createObjectId(id: any, metadata: EntityMetadata): any {
        if (metadata.idColumn.isAutoGenerated && !id) {
            return this.connection.driver.generateId();
        } else if (metadata.idColumn.isAutoGenerated && id) {
            return id;
        } else if (metadata.idColumn.isObjectId) {
            return this.connection.driver.createObjectId(id);
        }

        throw new Error("Cannot create object id");
        // return this.connection.driver.createObjectId(id, metadata.idColumn.isObjectId);
    }

}