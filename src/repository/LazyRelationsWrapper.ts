import {RelationMetadata} from "../metadata/RelationMetadata";
import {EntityMetadataCollection} from "../metadata-args/collection/EntityMetadataCollection";
import {Broadcaster} from "../subscriber/Broadcaster";
import {Driver} from "../driver/Driver";
import {QueryBuilder} from "../query-builder/QueryBuilder";

export class LazyRelationsWrapper {
    
    constructor(private driver: Driver,
                private entityMetadatas: EntityMetadataCollection,
                private broadcaster: Broadcaster) {
        
    }
    
    wrap(object: Object, relation: RelationMetadata) {
        const lazyRelationsWrapper = this;
        const index = "__" + relation.propertyName + "__";
        Object.defineProperty(object, relation.propertyName, {
            get: function() {
                if (this[index])
                    return Promise.resolve(this[index]);

                const qb = new QueryBuilder(lazyRelationsWrapper.driver, lazyRelationsWrapper.entityMetadatas, lazyRelationsWrapper.broadcaster);
                if (relation.isManyToMany || relation.isOneToMany) {

                    if (relation.hasInverseSide) {
                        qb.select(relation.propertyName)
                            .from(relation.inverseRelation.target, relation.propertyName)
                            .innerJoin(`${relation.propertyName}.${relation.inverseRelation.propertyName}`, relation.entityMetadata.targetName);
                    } else {
                        qb.select(relation.propertyName)
                            .from(relation.type, relation.propertyName)
                            .innerJoin(relation.junctionEntityMetadata.table.name, relation.junctionEntityMetadata.name, "ON",
                                `${relation.junctionEntityMetadata.name}.${relation.name}=:${relation.propertyName}Id`)
                            .setParameter(relation.propertyName + "Id", this[relation.referencedColumnName]);
                    }

                    //
                    // const inverseSide = relation.hasInverseSide ?  as Function : relation.type as Function;
                    // const join = relation.hasInverseSide ? `${relation.propertyName}.${relation.inverseRelation.name}` : relation.target as string;
                    // const inverseSide = relation.hasInverseSide ? relation.inverseRelation.target : relation.type;
                    // find object metadata and try to load

                    // console.log(qb.getSql());

                    return qb.getResults().then(results => {
                        this[index] = results;
                        return this[index];
                    });

                } else {

                    const inverseSide = relation.hasInverseSide ? relation.inverseRelation.target as Function : relation.type as Function;
                    const join = relation.hasInverseSide ? `${relation.propertyName}.${relation.inverseRelation.name}` : relation.target as string;
                    // const inverseSide = relation.hasInverseSide ? relation.inverseRelation.target : relation.type;

                    // find object metadata and try to load
                    qb.select(relation.propertyName)
                        .from(inverseSide, relation.propertyName)
                        .innerJoin(join, relation.entityMetadata.targetName, "ON",
                            `${relation.entityMetadata.targetName}.${relation.name}=:${relation.propertyName}Id`)
                        // .where(`${relation.propertyName}.${relation.referencedColumnName}=:${relation.propertyName}Id`)
                        .setParameter(relation.propertyName + "Id", this[relation.referencedColumnName]);

                    // console.log(qb.getSql());

                    return qb.getSingleResult().then(result => {
                        this[index] = result;
                        return this[index];
                    });
                }
            },
            set: function(promise: Promise<any>) {
                if (promise instanceof Promise) {
                    promise.then(result => {
                        this[index] = result;
                    });
                    Promise.resolve();
                } else {
                    this[index] = promise;
                }
            }
        });
    }
    
}