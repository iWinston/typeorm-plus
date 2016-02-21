import {DocumentSchema} from "../../schema/DocumentSchema";
import {Connection} from "../../connection/Connection";
import {RelationSchema} from "../../schema/RelationSchema";
import {CascadeOption, DynamicCascadeOptions} from "./../cascade/CascadeOption";
import {RemoveOperation} from "./../operation/RemoveOperation";
import {InverseSideUpdateOperation} from "./../operation/InverseSideUpdateOperation";
import {CascadeOptionUtils} from "../cascade/CascadeOptionUtils";
import {NoDocumentWithSuchIdError} from "../error/NoDocumentWithSuchIdError";
import {ObjectID} from "mongodb";

/**
 * Helps to remove a document and all its relations by given cascade operations.
 */
export class DocumentRemover<Document> {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    private connection: Connection;
    private inverseSideUpdateOperations: InverseSideUpdateOperation[] = [];
    private removeOperations: RemoveOperation[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(connection: Connection) {
        this.connection = connection;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Computes and creates a list of all related documents that should exist in the given document, but are missing.
     * Those missing documents are treated as removed (even if they are not loaded at all, so be careful).
     */
    computeRemovedRelations(schema: DocumentSchema,
                            document: Document,
                            dynamicCascadeOptions?: DynamicCascadeOptions<Document>): Promise<void> {

        let documentId = schema.getDocumentId(document);
        let cascadeOptions = CascadeOptionUtils.prepareCascadeOptions(schema, dynamicCascadeOptions);
        if (!documentId)
            return Promise.resolve();

        // load original document so we can compare and calculate changed set
        // const query = this.connection.driver.createIdCondition(schema.getIdValue(documentId));
        const query = schema.createIdCondition(documentId);
        return this.connection.driver.findOne(schema.name, query).then((dbObject: any) => {
            if (!dbObject)
                return Promise.resolve();
                // throw new NoDocumentWithSuchIdException(documentId, schema.name);

            // iterate throw each key in the document and find relations to compute removals of
            let promises = Object.keys(dbObject).map(originalDocumentProperty => {

                let relationWithOne = schema.findRelationWithOneByDbName(originalDocumentProperty);
                if (relationWithOne) {
                    let id = schema.getIdValue(dbObject[originalDocumentProperty]);
                    return this.computeRelationToBeRemoved(id, relationWithOne, document, cascadeOptions);
                }

                let relationWithMany = schema.findRelationWithManyByDbName(originalDocumentProperty);
                if (relationWithMany) {
                    return Promise.all(dbObject[originalDocumentProperty].map((id: any) => {
                        return this.computeRelationToBeRemoved(schema.getIdValue(id), relationWithMany, document, cascadeOptions);
                    }));
                }

            });
            return Promise.all<any>(promises).then(function() {});
        });
    }

    /**
     * Executes all remove operations. This means all document that are saved to be removed gonna remove now.
     */
    executeRemoveOperations(): Promise<void> {
        return Promise.all(this.removeOperations.map(operation => {
            let broadcaster = this.connection.getBroadcaster(operation.schema.documentClass);
            // const query = this.connection.driver.createIdCondition(operation.schema.getIdValue(operation.id));
            const query = operation.schema.createIdCondition(operation.id);
            broadcaster.broadcastBeforeRemove({ documentId: operation.id });
            return this.connection.driver.deleteOne(operation.schema.name, query).then(result => {
                broadcaster.broadcastAfterRemove({ documentId: operation.id });
            });
        })).then(function() {});
    }

    /**
     * Performs all inverse side update operations. These operations mean when we remove some document which is used
     * in another document, we must go to that document and remove this usage from him. This is what this function does.
     */
    executeUpdateInverseSideRelationRemoveIds(): Promise<void> {
        let inverseSideUpdates = this.excludeRemovedDocumentsFromInverseSideUpdateOperations();
        let updateInverseSideWithIdPromises = inverseSideUpdates.map(relationOperation => {

            let inverseSideSchema = relationOperation.inverseSideDocumentSchema;
            let inverseSideProperty = relationOperation.inverseSideDocumentRelation.name;
            let id = relationOperation.getDocumentId(); // this.connection.driver.createObjectId(relationOperation.getDocumentId());
            // let findCondition = this.connection.driver.createIdCondition(inverseSideSchema.getIdValue(relationOperation.inverseSideDocumentId));
            const findCondition = inverseSideSchema.createIdCondition(relationOperation.inverseSideDocumentId);

            if (inverseSideSchema.hasRelationWithOneWithName(inverseSideProperty))
                return this.connection.driver.unsetOneRelation(inverseSideSchema.name, findCondition, inverseSideProperty, id);
            if (inverseSideSchema.hasRelationWithManyWithPropertyName(inverseSideProperty))
                return this.connection.driver.unsetManyRelation(inverseSideSchema.name, findCondition, inverseSideProperty, id);
        });

        return Promise.all(updateInverseSideWithIdPromises).then(function() {});
    }

    /**
     * Registers given document id of the given schema for a removal operation.
     */
    registerDocumentRemoveOperation(schema: DocumentSchema,
                                    documentId: string,
                                    dynamicCascadeOptions?: DynamicCascadeOptions<Document>): Promise<void> {

        let cascadeOptions = CascadeOptionUtils.prepareCascadeOptions(schema, dynamicCascadeOptions);

        // load original document so we can compare and calculate which of its relations to remove by cascades
        // const query = this.connection.driver.createIdCondition(schema.getIdValue(documentId));
        const query = schema.createIdCondition(documentId);
        return this.connection.driver.findOne(schema.name, query).then((dbObject: any) => {
            if (!dbObject)
                return Promise.resolve();
                // throw new NoDocumentWithSuchIdException(documentId, schema.name);

            // iterate throw each key in the db document and find relations to compute removals of
            let promises = Object.keys(dbObject).map(originalDocumentProperty => {

                let relationWithOneField = schema.findRelationWithOneByDbName(originalDocumentProperty);
                if (relationWithOneField) {
                    let id = schema.getIdValue(dbObject[originalDocumentProperty]);
                    return this.parseRelationForRemovalOperation(id, schema, documentId, relationWithOneField, cascadeOptions);
                }

                let relationWithManyField = schema.findRelationWithManyByDbName(originalDocumentProperty);
                if (relationWithManyField)
                    return Promise.all(dbObject[originalDocumentProperty].map((id: any) => {
                        return this.parseRelationForRemovalOperation(schema.getIdValue(id), schema, documentId, relationWithManyField, cascadeOptions);
                    }));
            });

            // register a new remove operation
            this.removeOperations.push({ schema: schema, id: documentId });
            return Promise.all<any>(promises).then(function() {});
        });
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    /**
     * Computes if item with given id in a given relation should be removed or not.
     */
    private computeRelationToBeRemoved(id: string, relation: RelationSchema, document: Document|any, cascadeOptions?: CascadeOption[]): Promise<void> {
        let cascadeOption = CascadeOptionUtils.find(cascadeOptions, relation.propertyName);
        let relatedSchema = this.connection.getSchema(<Function> relation.type);
        let subCascades = cascadeOption ? cascadeOption.cascades : undefined;

        // if cascades are not enabled for this relation then skip it
        if (!CascadeOptionUtils.isCascadeRemove(relation, cascadeOption)) return;

        // if such document id already marked for remove operations then do nothing - no need to add it again
        if (this.isRemoveOperation(id, relatedSchema)) return;

        // if related document with given id does exists in the document then it means that nothing is removed from document and we dont have to remove anything from the db
        let isThisIdInDocumentsRelation = !!document[relation.propertyName];
        if (document[relation.propertyName] instanceof Array)
            isThisIdInDocumentsRelation = document[relation.propertyName].filter((item: any) => {
                const idFieldValue = relatedSchema.getDocumentId(item);
                return idFieldValue instanceof ObjectID ? idFieldValue.equals(id) : idFieldValue === id;
            }).length > 0;

        if (isThisIdInDocumentsRelation) return;

        return this.registerDocumentRemoveOperation(relatedSchema, id, subCascades);
    }

    /**
     * Parse given documents relation and registers relations's data remove operations.
     */
    private parseRelationForRemovalOperation(id: string,
                                             schema: DocumentSchema,
                                             documentId: string,
                                             relation: RelationSchema,
                                             cascadeOptions?: CascadeOption[]): Promise<void> {

        let cascadeOption = CascadeOptionUtils.find(cascadeOptions, relation.propertyName);
        let relatedSchema = this.connection.getSchema(<Function> relation.type);
        let subCascades = cascadeOption ? cascadeOption.cascades : undefined;

        // if removal operation already registered then no need to register it again
        if (this.isRemoveOperation(id, relatedSchema)) return;

        // add new inverse side update operation
        if (relation.inverseSideProperty) {
            const inverseSideRelationSchema = relatedSchema.findRelationByPropertyName(relation.inverseSideProperty);
            this.inverseSideUpdateOperations.push({
                inverseSideDocumentId: id,
                inverseSideDocumentSchema: relatedSchema,
                inverseSideDocumentRelation: inverseSideRelationSchema,
                documentSchema: schema,
                getDocumentId: () => documentId
            });
        }

        // register document and its relations for removal if cascade operation is set
        if (CascadeOptionUtils.isCascadeRemove(relation, cascadeOption)) {
            return this.registerDocumentRemoveOperation(relatedSchema, id, subCascades);
        }
    }

    /**
     * Checks if remove operation with given document id and schema is registered or not.
     */
    private isRemoveOperation(id: string, schema: DocumentSchema): boolean {
        return this.removeOperations.filter(operation => operation.id === id && operation.schema === schema).length > 0;
    }

    /**
     * From operations that are scheduled for update we remove all updates of documents that are scheduled for removal.
     * Since they are removed there is no since in updating them, e.g. they are removed and nothing to update.
     */
    private excludeRemovedDocumentsFromInverseSideUpdateOperations(): InverseSideUpdateOperation[] {
        return this.inverseSideUpdateOperations.filter(updateOperation => {
            return this.removeOperations.filter(removeOperation => removeOperation.id === updateOperation.inverseSideDocumentId).length === 0;
        });
    }

}