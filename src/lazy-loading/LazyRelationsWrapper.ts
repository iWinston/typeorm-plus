import {RelationMetadata} from "../metadata/RelationMetadata";
import {QueryBuilder} from "../query-builder/QueryBuilder";
import {Connection} from "../connection/Connection";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * This class wraps entities and provides functions there to lazily load its relations.
 */
export class LazyRelationsWrapper {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    wrap(object: Object, relation: RelationMetadata) {
        const connection = this.connection;
        const index = "__" + relation.propertyName + "__";
        const promiseIndex = "__promise__" + relation.propertyName + "__";
        const resolveIndex = "__has__" + relation.propertyName + "__";

        Object.defineProperty(object, relation.propertyName, {
            get: function() {
                if (this[resolveIndex] === true)
                    return Promise.resolve(this[index]);
                if (this[promiseIndex])
                    return this[promiseIndex];
                const qb = new QueryBuilder(connection);

                if (relation.isManyToOne || relation.isOneToOneOwner) {

                    const joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation.joinColumns;
                    const conditions = joinColumns.map(joinColumn => {
                        return `${relation.entityMetadata.name}.${relation.propertyName} = ${relation.propertyName}.${joinColumn.referencedColumn.propertyName}`;
                    }).join(" AND ");

                    // (ow) post.category<=>category.post
                    // loaded: category from post
                    // example: SELECT category.id AS category_id, category.name AS category_name FROM category category
                    //              INNER JOIN post Post ON Post.category=category.id WHERE Post.id=1
                    qb.select(relation.propertyName) // category
                        .from(relation.type, relation.propertyName) // Category, category
                        .innerJoin(relation.entityMetadata.target as Function, relation.entityMetadata.name, conditions);

                    relation.joinColumns.forEach(joinColumn => {
                        qb.andWhere(`${relation.entityMetadata.name}.${joinColumn.referencedColumn.fullName} = :${joinColumn.referencedColumn.fullName}`)
                            .setParameter(`${joinColumn.referencedColumn.fullName}`, this[joinColumn.referencedColumn.fullName])
                    });

                    this[promiseIndex] = qb.getOne().then(result => {
                        this[index] = result;
                        this[resolveIndex] = true;
                        delete this[promiseIndex];
                        return this[index];

                    }).catch(err => {
                        throw err;
                    });
                    return this[promiseIndex];

                } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {

                    /*
                     SELECT post
                     FROM post post
                     WHERE post.[joinColumn.name] = this[joinColumn.referencedColumn]
                     */
                    qb.select(relation.propertyName)
                        .from(relation.inverseRelation.entityMetadata.target, relation.propertyName);

                    relation.inverseRelation.joinColumns.forEach(joinColumn => {
                        qb.andWhere(`${relation.propertyName}.${joinColumn.name} = :${joinColumn.referencedColumn.fullName}`)
                            .setParameter(`${joinColumn.referencedColumn.fullName}`, this[joinColumn.referencedColumn.fullName])
                    });

                    const result = relation.isOneToMany ? qb.getMany() : qb.getOne();
                    this[promiseIndex] = result.then(results => {
                        this[index] = results;
                        this[resolveIndex] = true;
                        delete this[promiseIndex];
                        return this[index];

                    }).catch(err => {
                        throw err;
                    });
                    return this[promiseIndex];

                } else { // ManyToMany

                    const mainAlias = relation.propertyName;
                    const joinAlias = relation.junctionEntityMetadata.table.name;
                    let joinColumnConditions: string[] = [];
                    let inverseJoinColumnConditions: string[] = [];
                    let parameters: ObjectLiteral;

                    if (relation.isOwning) {
                        /*
                             SELECT category
                             FROM category category
                             INNER JOIN post_categories post_categories
                                 ON post_categories.postId = :postId
                                 AND post_categories.categoryId = category.id
                         */

                        joinColumnConditions = relation.joinTable.joinColumns.map(joinColumn => {
                            return `${joinAlias}.${joinColumn.name} = :${joinColumn.name}`;
                        });
                        inverseJoinColumnConditions = relation.joinTable.inverseJoinColumns.map(inverseJoinColumn => {
                            return `${joinAlias}.${inverseJoinColumn.name}=${mainAlias}.${inverseJoinColumn.referencedColumn.fullName}`;
                        });
                        parameters = relation.joinTable.joinColumns.reduce((parameters, joinColumn) => {
                            parameters[joinColumn.name] = this[joinColumn.referencedColumn.propertyName];
                            return parameters;
                        }, {} as ObjectLiteral);

                    } else {
                        /*
                             SELECT post
                             FROM post post
                             INNER JOIN post_categories post_categories
                                 ON post_categories.postId = post.id
                                 AND post_categories.categoryId = post_categories.categoryId
                         */

                        joinColumnConditions = relation.inverseRelation.joinTable.joinColumns.map(joinColumn => {
                            return `${joinAlias}.${joinColumn.name} = ${mainAlias}.${joinColumn.referencedColumn.fullName}`;
                        });
                        inverseJoinColumnConditions = relation.inverseRelation.joinTable.inverseJoinColumns.map(inverseJoinColumn => {
                            return `${joinAlias}.${inverseJoinColumn.name} = :${inverseJoinColumn.name}`;
                        });
                        parameters = relation.inverseRelation.joinTable.inverseJoinColumns.reduce((parameters, joinColumn) => {
                            parameters[joinColumn.name] = this[joinColumn.referencedColumn.propertyName];
                            return parameters;
                        }, {} as ObjectLiteral);
                    }

                    const conditions = joinColumnConditions.concat(inverseJoinColumnConditions).join(" AND ");
                    qb.select(mainAlias)
                        .from(relation.type, mainAlias)
                        .innerJoin(joinAlias, joinAlias, conditions)
                        .setParameters(parameters);

                    this[promiseIndex] = qb.getMany().then(results => {
                        this[index] = results;
                        this[resolveIndex] = true;
                        delete this[promiseIndex];
                        return this[index];
                    }).catch(err => {
                        throw err;
                    });
                    return this[promiseIndex];
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