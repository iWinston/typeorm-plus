import {RelationMetadata} from "../metadata/RelationMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Connection} from "../connection/Connection";

export class LazyRelationsWrapper {
    
    constructor(private connection: Connection) {
        
    }
    
    wrap(object: Object, relation: RelationMetadata) {
        const connection = this.connection;
        const index = "__" + relation.propertyName + "__";
        const loadIndex = "__load_" + relation.propertyName + "__";
        const resolveIndex = "__has_" + relation.propertyName + "__";
        
        Object.defineProperty(object, relation.propertyName, {
            get: function() {
                if (this[resolveIndex] === true)
                    return Promise.resolve(this[index]);
                if (this[loadIndex])
                    return this[loadIndex];

                const qb = new QueryBuilder(connection);
                if (relation.isManyToMany || relation.isOneToMany) {

                    if (relation.hasInverseSide) { // if we don't have inverse side then we can't select and join by relation from inverse side
                        qb.select(relation.propertyName)
                            .from(relation.inverseRelation.entityMetadata.target, relation.propertyName)
                            .innerJoin(`${relation.propertyName}.${relation.inverseRelation.propertyName}`, relation.entityMetadata.targetName);
                    } else {
                        qb.select(relation.propertyName)
                            .from(relation.type, relation.propertyName)
                            .innerJoin(relation.junctionEntityMetadata.table.name, relation.junctionEntityMetadata.name,
                                `${relation.junctionEntityMetadata.name}.${relation.name}=:${relation.propertyName}Id`)
                            .setParameter(relation.propertyName + "Id", this[relation.referencedColumnName]);
                    }

                    this[loadIndex] = qb.getMany().then(results => {
                        this[index] = results;
                        this[resolveIndex] = true;
                        delete this[loadIndex];
                        return this[index];
                    }).catch(err => {
                        throw err;
                    });
                    return this[loadIndex];

                } else {

                    if (relation.hasInverseSide) {
                        qb.select(relation.propertyName)
                            .from(relation.inverseRelation.entityMetadata.target, relation.propertyName)
                            .innerJoin(`${relation.propertyName}.${relation.inverseRelation.propertyName}`, relation.entityMetadata.targetName);

                    } else {
                        // (ow) post.category<=>category.post
                        // loaded: category from post
                        qb.select(relation.propertyName) // category
                            .from(relation.type, relation.propertyName) // Category, category
                            .innerJoin(relation.entityMetadata.target as Function, relation.entityMetadata.name,
                                `${relation.entityMetadata.name}.${relation.propertyName}=:${relation.propertyName}Id`) // Post, post, post.category = categoryId
                            .setParameter(relation.propertyName + "Id", this[relation.referencedColumnName]);
                    }
                    // console.log(qb.getSql());
                    this[loadIndex] = qb.getOne().then(result => {
                        this[index] = result;
                        this[resolveIndex] = true;
                        delete this[loadIndex];
                        return this[index];
                    }).catch(err => {
                        throw err;
                    });
                    return this[loadIndex];
                }
            },
            set: function(promise: Promise<any>) {
                if (promise instanceof Promise) {
                    promise.then(result => {
                        this[index] = result;
                        this[resolveIndex] = true;
                    });
                } else {
                    this[index] = promise;
                    this[resolveIndex] = true;
                }
            },
            configurable: true
        });
    }
    
}