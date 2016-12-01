import {Repository} from "./Repository";
import {QueryBuilder} from "../query-builder/QueryBuilder";

/**
 * Repository with additional functions to work with trees.
 *
 * @see Repository
 */
export class TreeRepository<Entity> extends Repository<Entity> {

    // todo: implement moving
    // todo: implement removing
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Roots are entities that have no ancestors. Finds them all.
     */
    findRoots(): Promise<Entity[]> {
        const parentPropertyName = this.metadata.treeParentRelation.propertyName;
        return this.createQueryBuilder("treeEntity")
            .where(`treeEntity.${parentPropertyName} IS NULL`)
            .getMany();
    }

    /**
     * Creates a query builder used to get descendants of the entities in a tree.
     */
    createDescendantsQueryBuilder(alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        const joinCondition = `${alias}.${this.metadata.firstPrimaryColumn.name}=${closureTableAlias}.descendant`;
        return this.createQueryBuilder(alias)
            .innerJoin(this.metadata.closureJunctionTable.table.name, closureTableAlias, joinCondition)
            .where(`${closureTableAlias}.ancestor=${this.metadata.getEntityIdMap(entity)![this.metadata.firstPrimaryColumn.propertyName]}`);
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them all in a flat array.
     */
    findDescendants(entity: Entity): Promise<Entity[]> {
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getMany();
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.
     */
    findDescendantsTree(entity: Entity): Promise<Entity> {
        // todo: throw exception if there is no column of this relation?
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getEntitiesAndScalarResults()
            .then(entitiesAndScalars => {
                const relationMaps = this.createRelationMaps("treeEntity", entitiesAndScalars.scalarResults);
                this.buildChildrenEntityTree(entity, entitiesAndScalars.entities, relationMaps);
                return entity;
            });
    }

    /**
     * Gets number of descendants of the entity.
     */
    countDescendants(entity: Entity): Promise<number> {
        return this
            .createDescendantsQueryBuilder("treeEntity", "treeClosure", entity)
            .getCount();
    }
    
    /**
     * Creates a query builder used to get ancestors of the entities in the tree.
     */
    createAncestorsQueryBuilder(alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        const joinCondition = `${alias}.${this.metadata.firstPrimaryColumn.name}=${closureTableAlias}.ancestor`;
        return this.createQueryBuilder(alias)
            .innerJoin(this.metadata.closureJunctionTable.table.name, closureTableAlias, joinCondition)
            .where(`${closureTableAlias}.descendant=${this.metadata.getEntityIdMap(entity)![this.metadata.firstPrimaryColumn.propertyName]}`);
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them all in a flat array.
     */
    findAncestors(entity: Entity): Promise<Entity[]> {
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getMany();
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them in a tree - nested into each other.
     */
    findAncestorsTree(entity: Entity): Promise<Entity> {
        // todo: throw exception if there is no column of this relation?
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getEntitiesAndScalarResults()
            .then(entitiesAndScalars => {
                const relationMaps = this.createRelationMaps("treeEntity", entitiesAndScalars.scalarResults);
                this.buildParentEntityTree(entity, entitiesAndScalars.entities, relationMaps);
                return entity;
            });
    }

    /**
     * Gets number of ancestors of the entity.
     */
    countAncestors(entity: Entity): Promise<number> {
        return this
            .createAncestorsQueryBuilder("treeEntity", "treeClosure", entity)
            .getCount();
    }

    /**
     * Moves entity to the children of then given entity.
     *
    move(entity: Entity, to: Entity): Promise<void> {
        return Promise.resolve();
    } */

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    protected createRelationMaps(alias: string, scalarResults: any[]): { id: any, parentId: any }[] {
        return scalarResults.map(scalarResult => {
            return {
                id: scalarResult[alias + "_" + this.metadata.firstPrimaryColumn.name],
                parentId: scalarResult[alias + "_" + this.metadata.treeParentRelation.name]
            };
        });
    }
    
    protected buildChildrenEntityTree(entity: any, entities: any[], relationMaps: { id: any, parentId: any }[]): void {
        const childProperty = this.metadata.treeChildrenRelation.propertyName;
        const parentEntityId = entity[this.metadata.firstPrimaryColumn.propertyName];
        const childRelationMaps = relationMaps.filter(relationMap => relationMap.parentId === parentEntityId);
        const childIds = childRelationMaps.map(relationMap => relationMap.id);
        entity[childProperty] = entities.filter(entity => childIds.indexOf(entity[this.metadata.firstPrimaryColumn.propertyName]) !== -1);
        entity[childProperty].forEach((childEntity: any) => {
            this.buildChildrenEntityTree(childEntity, entities, relationMaps);
        });
    }
    
    protected buildParentEntityTree(entity: any, entities: any[], relationMaps: { id: any, parentId: any }[]): void {
        const parentProperty = this.metadata.treeParentRelation.propertyName;
        const entityId = entity[this.metadata.firstPrimaryColumn.propertyName];
        const parentRelationMap = relationMaps.find(relationMap => relationMap.id === entityId);
        const parentEntity = entities.find(entity => {
            if (!parentRelationMap)
                return false;
                
            return entity[this.metadata.firstPrimaryColumn.propertyName] === parentRelationMap.parentId;
        });
        if (parentEntity) {
            entity[parentProperty] = parentEntity;
            this.buildParentEntityTree(entity[parentProperty], entities, relationMaps);
        }
    }
    
}