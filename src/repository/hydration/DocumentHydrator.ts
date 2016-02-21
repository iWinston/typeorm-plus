import {Driver} from "../../driver/Driver";
import {Connection} from "../../connection/Connection";
import {Repository} from "./../Repository";
import {JoinFieldOption} from "./JoinFieldOption";
import {RelationSchema} from "../../schema/RelationSchema";
import {DocumentSchema} from "../../schema/DocumentSchema";

/**
 * Loads the document
 */
export class DocumentHydrator<Document> {

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

    hydrate(schema: DocumentSchema,
            dbObject: Object|any,
            joinFields?: JoinFieldOption[]|any[]): Promise<Document> {

        let allPromises: Promise<any>[] = [];
        let document: Document|any = schema.create();
        let isDocumentSkipped = false;

        if (schema.idField) // remember that id field cannot be in embed documents
            document[schema.idField.name] = schema.getIdValue(dbObject[this.connection.driver.getIdFieldName()]);
        schema.fields.filter(field => dbObject[field.name] !== undefined).forEach(field => {

            if (dbObject[field.name] instanceof Array && field.isTypeDocument()) {
                let embedTypeSchema = this.connection.getSchema(<Function> field.type);
                let subCondition = this.getSubFieldCondition(joinFields, field.name);
                let promises = dbObject[field.name].map((i: any) => this.hydrate(embedTypeSchema, i, subCondition));
                allPromises.push(Promise.all(promises).then((subDocuments: any[]) => {
                    document[field.propertyName] = subDocuments;
                }));
            } else if (dbObject[field.name] instanceof Object && field.isTypeDocument()) {
                let embedTypeSchema = this.connection.getSchema(<Function> field.type);
                let subCondition = this.getSubFieldCondition(joinFields, field.name);
                allPromises.push(this.hydrate(embedTypeSchema, dbObject[field.name], subCondition).then(subDocument => {
                    document[field.propertyName] = subDocument;
                }));
            } else {
                document[field.propertyName] = dbObject[field.name];
            }
        });

        schema.relationWithOnes.forEach(relation => {

            let relationId = dbObject[relation.name];
            let canLoadRelation = this.canLoadRelation(relation, joinFields);
            let isLoadInnerTyped = this.isInnerJoin(joinFields, relation.name) || relation.isAlwaysInnerJoin;

            if (!canLoadRelation)
                return;
            if (!relationId && isLoadInnerTyped) {
                isDocumentSkipped = true;
                return;
            }

            let relatedRepo = this.connection.getRepository(<Function> relation.type);
            let subFields   = this.getSubFields(joinFields, relation.name);
            let conditions: any = { [this.connection.driver.getIdFieldName()]: relationId };
            let subCondition = this.getSubFieldCondition(joinFields, relation.name);
            if (subCondition)
                Object.keys(subCondition).forEach(key => conditions[key] = subCondition[key]);

            allPromises.push(relatedRepo.findOne(conditions, null, subFields).then(foundRelation => {
                if (!foundRelation && isLoadInnerTyped) {
                    isDocumentSkipped = true;
                } else if (foundRelation) {
                    document[relation.propertyName] = foundRelation;
                }
            }));
        });

        schema.relationWithManies.forEach(relation => {

            let canLoadRelation = this.canLoadRelation(relation, joinFields);
            let isLoadInnerTyped = this.isInnerJoin(joinFields, relation.name) || relation.isAlwaysInnerJoin;

            if (!canLoadRelation)
                return;
            if ((!dbObject[relation.name] || !dbObject[relation.name].length) && isLoadInnerTyped) {
                isDocumentSkipped = true;
                return;
            }
            if (!dbObject[relation.name] || !dbObject[relation.name].length)
                return;

            let relatedRepo = this.connection.getRepository(<Function> relation.type);
            let subFields   = this.getSubFields(joinFields, relation.name);
            let findPromises = dbObject[relation.name].map((i: any) => {
                let conditions: any = { [this.connection.driver.getIdFieldName()]: i };
                let subCondition = this.getSubFieldCondition(joinFields, relation.name);
                if (subCondition)
                    Object.keys(subCondition).forEach(key => conditions[key] = subCondition[key]);
                return relatedRepo.findOne(conditions, null, subFields);
            });

            allPromises.push(Promise.all(findPromises).then(foundRelations => {
                foundRelations = foundRelations.filter(relation => !!relation);
                if ((!foundRelations || !foundRelations.length) && isLoadInnerTyped) {
                    isDocumentSkipped = true;
                } else if (foundRelations) {
                    document[relation.propertyName] = foundRelations;
                }
            }));
        });

        return Promise.all(allPromises).then(results => !isDocumentSkipped ? document : null);
    }

    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------

    private canLoadRelation(relation: RelationSchema, joinFields?: JoinFieldOption[]|any[]): boolean {
        return this.hasKey(joinFields, relation.propertyName)
            || relation.isAlwaysLeftJoin
            || relation.isAlwaysInnerJoin;
    }

    private hasKey(joinFields: JoinFieldOption[]|any[], key: string) {
        return (
            (<string[]> joinFields).indexOf(key) !== -1 ||
            joinFields.reduce((found, field) => (field instanceof Array && field[0] === key) ? true : found, false) ||
            joinFields.reduce((found: any, field: JoinFieldOption) => (field && field.field && field.field === key) ? true : found, false)
        );
    }

    private isInnerJoin(joinFields: JoinFieldOption[]|any[], key: string) {
        return joinFields.reduce((sub, field) => {
            if (field instanceof Array && field[0] === key)
                return field[1];
            if (field instanceof Object && field.field && field.field === key)
                return field.inner;

            return sub;
        }, null);
    }

    private getSubFields(joinFields: JoinFieldOption[]|any[], key: string) {
        return joinFields.reduce((sub, field) => {
            if (field instanceof Array && field[0] === key)
                return field[1];
            if (field instanceof Object && field.field && field.field === key)
                return field.joins;

            return sub;
        }, null);
    }

    private getSubFieldCondition(joinFields: JoinFieldOption[]|any[], key: string): any {
        return joinFields.reduce((sub, field) => {
            if (field instanceof Array && field[0] === key)
                return field[2];
            if (field instanceof Object && field.field && field.field === key)
                return field.condition;

            return sub;
        }, null);
    }

}