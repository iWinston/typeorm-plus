import {Connection} from "../../connection/Connection";
import {CascadeOption, DynamicCascadeOptions} from "./../cascade/CascadeOption";
import {RelationMetadata} from "../../metadata-builder/metadata/RelationMetadata";
import {DocumentToDbObjectTransformer} from "./DocumentToDbObjectTransformer";
import {PersistOperation} from "./../operation/PersistOperation";
import {InverseSideUpdateOperation} from "./../operation/InverseSideUpdateOperation";
import {PersistOperationGrouppedByDeepness} from "../operation/PersistOperationGrouppedByDeepness";

export class EntityPersister {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connection: Connection;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    persist<Entity>(schema: DocumentSchema, document: Document, cascadeOptions?: DynamicCascadeOptions<Document>): Promise<Entity> {

    }

}

export class DocumentPersister<Document> {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connection: Connection;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    persist(schema: DocumentSchema, document: Document, cascadeOptions?: DynamicCascadeOptions<Document>): Promise<Document> {
        let transformer = new DocumentToDbObjectTransformer<Document>(this.connection);
        let dbObject = transformer.transform(schema, document, cascadeOptions);
        let groupedPersistOperations = this.groupPersistOperationsByDeepness(transformer.persistOperations);
        groupedPersistOperations = groupedPersistOperations.sort(groupedOperation => groupedOperation.deepness * -1);

        let pendingPromise: Promise<any>;
        let relationWithOneDocumentIdsToBeUpdated: InverseSideUpdateOperation[] = [];
        groupedPersistOperations.map(groupedPersistOperation => {
            pendingPromise = Promise.all([pendingPromise]).then(() => {
                return Promise.all(groupedPersistOperation.operations.filter(persistOperation => !!persistOperation.allowedPersist).map((persistOperation: PersistOperation) =>
                    this.save(persistOperation.schema, persistOperation.document, persistOperation.dbObject).then(document => {
                        if (persistOperation.afterExecution) {
                            persistOperation.afterExecution.forEach(afterExecution => {
                                relationWithOneDocumentIdsToBeUpdated.push(afterExecution(document));
                            });
                        }
                        return document;
                    })
                ));
            });
        });

        transformer.postPersistOperations.forEach(postPersistOperation => postPersistOperation());

        return Promise.all([pendingPromise])
            .then(result => this.save(schema, document, dbObject))
            .then(result => this.updateRelationInverseSideIds(relationWithOneDocumentIdsToBeUpdated))
            .then(result => document);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private groupPersistOperationsByDeepness(persistOperations: PersistOperation[]): PersistOperationGrouppedByDeepness[] {
        let groupedOperations: PersistOperationGrouppedByDeepness[] = [];
        persistOperations.forEach(persistOperation => {
            let groupedOperation = groupedOperations.reduce((found, groupedOperation) => groupedOperation.deepness === persistOperation.deepness ? groupedOperation : found, null);
            if (!groupedOperation) {
                groupedOperation = { deepness: persistOperation.deepness, operations: [] };
                groupedOperations.push(groupedOperation);
            }

            groupedOperation.operations.push(persistOperation);
        });
        return groupedOperations;
    }

    private save(schema: DocumentSchema, document: Document|any, dbObject: Object): Promise<Document> {
        let documentId = schema.getDocumentId(document);
        let driver = this.connection.driver;
        let broadcaster = this.connection.getBroadcaster(schema.documentClass);

        if (documentId) {
            // let conditions = driver.createIdCondition(schema.getIdValue(documentId)/*, schema.idField.isObjectId*/);
            let conditions = schema.createIdCondition(documentId);
            broadcaster.broadcastBeforeUpdate({ document: document, conditions: conditions });
            return driver.replaceOne(schema.name, conditions, dbObject, { upsert: true }).then(saved => {
                broadcaster.broadcastAfterUpdate({ document: document, conditions: conditions });
                return document;
            });
        } else {
            broadcaster.broadcastBeforeInsert({ document: document });
            return driver.insertOne(schema.name, dbObject).then(result => {
                if (result.insertedId)
                    document[schema.idField.name] = schema.getIdValue(result.insertedId); // String(result.insertedId);
                broadcaster.broadcastAfterInsert({ document: document });
                return document;
            });
        }
    }

    private updateRelationInverseSideIds(relationOperations: InverseSideUpdateOperation[]): Promise<any> {
        let updateInverseSideWithIdPromises = relationOperations
            .filter(relationOperation => !!relationOperation.inverseSideDocumentRelation)
            .map(relationOperation => {

                let inverseSideSchema = relationOperation.inverseSideDocumentSchema;
                let inverseSideProperty = relationOperation.inverseSideDocumentRelation.name;
                let id = relationOperation.getDocumentId(); // this.connection.driver.createObjectId(relationOperation.getDocumentId(), relationOperation.documentSchema.idField.isObjectId);
                // let findCondition = this.connection.driver.createIdCondition(inverseSideSchema.getIdValue(relationOperation.inverseSideDocumentId)/*, inverseSideSchema.idField.isObjectId*/);
                let findCondition = inverseSideSchema.createIdCondition(relationOperation.inverseSideDocumentId);

                if (inverseSideSchema.hasRelationWithOneWithName(inverseSideProperty))
                    return this.connection.driver.setOneRelation(inverseSideSchema.name, findCondition, inverseSideProperty, id);
                if (inverseSideSchema.hasRelationWithManyWithName(inverseSideProperty))
                    return this.connection.driver.setManyRelation(inverseSideSchema.name, findCondition, inverseSideProperty, id);
            });

        return Promise.all(updateInverseSideWithIdPromises);
    }

}