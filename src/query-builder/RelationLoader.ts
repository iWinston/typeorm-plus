import {RelationMetadata} from "../metadata/RelationMetadata";
import {Connection} from "../connection/Connection";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Helper class used to load relations and wrap lazy loaded relations.
 */
export class RelationLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Loads relation data for the given entity and its relation.
     */
    load(relation: RelationMetadata, entity: ObjectLiteral): Promise<any> {
        if (relation.isManyToOne || relation.isOneToOneOwner) {
            return this.loadManyToOneOrOneToOneOwner(relation, entity);

        } else if (relation.isOneToMany || relation.isOneToOneNotOwner) {
            return this.loadOneToManyOrOneToOneNotOwner(relation, entity);

        } else if (relation.isManyToManyOwner) {
            return this.loadManyToManyOwner(relation, entity);

        } else { // many-to-many non owner
            return this.loadManyToManyNotOwner(relation, entity);
        }
    }

    /**
     * Loads data for many-to-one and one-to-one owner relations.
     *
     * (ow) post.category<=>category.post
     * loaded: category from post
     * example: SELECT category.id AS category_id, category.name AS category_name FROM category category
     *              INNER JOIN post Post ON Post.category=category.id WHERE Post.id=1
     */
    loadManyToOneOrOneToOneOwner(relation: RelationMetadata, entity: ObjectLiteral): Promise<any> {
        const primaryColumns = relation.entityMetadata.primaryColumns;
        const joinColumns = relation.isOwning ? relation.joinColumns : relation.inverseRelation!.joinColumns;
        const conditions = joinColumns.map(joinColumn => {
            return `${relation.entityMetadata.name}.${relation.propertyName} = ${relation.propertyName}.${joinColumn.referencedColumn!.propertyName}`;
        }).join(" AND ");

        const qb = this.connection
            .createQueryBuilder()
            .select(relation.propertyName) // category
            .from(relation.type, relation.propertyName) // Category, category
            .innerJoin(relation.entityMetadata.target as Function, relation.entityMetadata.name, conditions);

        primaryColumns.forEach(primaryColumn => {
            qb.andWhere(`${relation.entityMetadata.name}.${primaryColumn.propertyPath} = :${primaryColumn.propertyName}`)
                .setParameter(`${primaryColumn.propertyName}`, primaryColumn.getEntityValue(entity));
        });

        return qb.getOne();
    }

    /**
     * Loads data for one-to-many and one-to-one not owner relations.
     *
     * SELECT post
     * FROM post post
     * WHERE post.[joinColumn.name] = entity[joinColumn.referencedColumn]
     */
    loadOneToManyOrOneToOneNotOwner(relation: RelationMetadata, entity: ObjectLiteral): Promise<any> {
        const qb = this.connection
            .createQueryBuilder()
            .select(relation.propertyName)
            .from(relation.inverseRelation!.entityMetadata.target, relation.propertyName);

        relation.inverseRelation!.joinColumns.forEach(joinColumn => {
            qb.andWhere(`${relation.propertyName}.${joinColumn.propertyName} = :${joinColumn.referencedColumn!.propertyName}`)
                .setParameter(`${joinColumn.referencedColumn!.propertyName}`, joinColumn.referencedColumn!.getEntityValue(entity));
        });
        return relation.isOneToMany ? qb.getMany() : qb.getOne();
    }

    /**
     * Loads data for many-to-many owner relations.
     *
     * SELECT category
     * FROM category category
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = :postId
     * AND post_categories.categoryId = category.id
     */
    loadManyToManyOwner(relation: RelationMetadata, entity: ObjectLiteral): Promise<any> {
        const mainAlias = relation.propertyName;
        const joinAlias = relation.junctionEntityMetadata!.tableName;
        const joinColumnConditions = relation.joinColumns.map(joinColumn => {
            return `${joinAlias}.${joinColumn.propertyName} = :${joinColumn.propertyName}`;
        });
        const inverseJoinColumnConditions = relation.inverseJoinColumns.map(inverseJoinColumn => {
            return `${joinAlias}.${inverseJoinColumn.propertyName}=${mainAlias}.${inverseJoinColumn.referencedColumn!.propertyName}`;
        });
        const parameters = relation.joinColumns.reduce((parameters, joinColumn) => {
            parameters[joinColumn.propertyName] = joinColumn.referencedColumn!.getEntityValue(entity);
            return parameters;
        }, {} as ObjectLiteral);

        return this.connection
            .createQueryBuilder()
            .select(mainAlias)
            .from(relation.type, mainAlias)
            .innerJoin(joinAlias, joinAlias, [...joinColumnConditions, ...inverseJoinColumnConditions].join(" AND "))
            .setParameters(parameters)
            .getMany();
    }

    /**
     * Loads data for many-to-many not owner relations.
     *
     * SELECT post
     * FROM post post
     * INNER JOIN post_categories post_categories
     * ON post_categories.postId = post.id
     * AND post_categories.categoryId = post_categories.categoryId
     */
    loadManyToManyNotOwner(relation: RelationMetadata, entity: ObjectLiteral): Promise<any> {
        const mainAlias = relation.propertyName;
        const joinAlias = relation.junctionEntityMetadata!.tableName;
        const joinColumnConditions = relation.inverseRelation!.joinColumns.map(joinColumn => {
            return `${joinAlias}.${joinColumn.propertyName} = ${mainAlias}.${joinColumn.referencedColumn!.propertyName}`;
        });
        const inverseJoinColumnConditions = relation.inverseRelation!.inverseJoinColumns.map(inverseJoinColumn => {
            return `${joinAlias}.${inverseJoinColumn.propertyName} = :${inverseJoinColumn.propertyName}`;
        });
        const parameters = relation.inverseRelation!.inverseJoinColumns.reduce((parameters, joinColumn) => {
            parameters[joinColumn.propertyName] = joinColumn.referencedColumn!.getEntityValue(entity);
            return parameters;
        }, {} as ObjectLiteral);

        return this.connection
            .createQueryBuilder()
            .select(mainAlias)
            .from(relation.type, mainAlias)
            .innerJoin(joinAlias, joinAlias, [...joinColumnConditions, ...inverseJoinColumnConditions].join(" AND "))
            .setParameters(parameters)
            .getMany();
    }

    /**
     * Wraps given entity and creates getters/setters for its given relation
     * to be able to lazily load data when accessing this relation.
     */
    enableLazyLoad(relation: RelationMetadata, entity: ObjectLiteral) {
        const relationLoader = this;
        const dataIndex = "__" + relation.propertyName + "__"; // in what property of the entity loaded data will be stored
        const promiseIndex = "__promise_" + relation.propertyName + "__"; // in what property of the entity loading promise will be stored
        const resolveIndex = "__has_" + relation.propertyName + "__"; // indicates if relation data already was loaded or not, we need this flag if loaded data is empty

        Object.defineProperty(entity, relation.propertyName, {
            get: function() {
                if (this[resolveIndex] === true) // if related data already was loaded then simply return it
                    return Promise.resolve(this[dataIndex]);

                if (this[promiseIndex]) // if related data is loading then return a promise relationLoader loads it
                    return this[promiseIndex];

                // nothing is loaded yet, load relation data and save it in the model once they are loaded
                this[promiseIndex] = relationLoader.load(relation, this).then(result => {
                    this[dataIndex] = result;
                    this[resolveIndex] = true;
                    delete this[promiseIndex];
                    return this[dataIndex];
                });
                return this[promiseIndex];
            },
            set: function(value: any|Promise<any>) {
                if (value instanceof Promise) { // if set data is a promise then wait for its resolve and save in the object
                    value.then(result => {
                        this[dataIndex] = result;
                        this[resolveIndex] = true;
                    });

                } else { // if its direct data set (non promise, probably not safe-typed)
                    this[dataIndex] = value;
                    this[resolveIndex] = true;
                }
            },
            configurable: true
        });
    }

}