import {ObjectLiteral} from "../common/ObjectLiteral";
import {SpecificRepository} from "./SpecificRepository";
import * as Rx from "rxjs/Rx";

/**
 * Reactive version of SpecificRepository.
 */
export class SpecificReactiveRepository<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected repository: SpecificRepository<Entity>) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    setRelation(relationName: string, entityId: any, relatedEntityId: any): Rx.Observable<void>;

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    setRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityId: any): Rx.Observable<void>;

    /**
     * Sets given relatedEntityId to the value of the relation of the entity with entityId id.
     * Should be used when you want quickly and efficiently set a relation (for many-to-one and one-to-many) to some entity.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    setRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityId: any): Rx.Observable<void> {
        const promiseFn = () => this.repository.setRelation(relationName as any, entityId, relatedEntityId);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<void>); // monkey patch because of rxjs bug
    }

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addToRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addToRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;

    /**
     * Adds a new relation between two entities into relation's many-to-many table.
     * Should be used when you want quickly and efficiently add a relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addToRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void> {
        const promiseFn = () => this.repository.addToRelation(relationName as any, entityId, relatedEntityIds);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<void>); // monkey patch because of rxjs bug
    }

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeFromRelation(relationName: string, entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeFromRelation(relationName: ((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void>;

    /**
     * Removes a relation between two entities from relation's many-to-many table.
     * Should be used when you want quickly and efficiently remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeFromRelation(relationName: string|((t: Entity) => string|any), entityId: any, relatedEntityIds: any[]): Rx.Observable<void> {
        const promiseFn = () => this.repository.removeFromRelation(relationName as any, entityId, relatedEntityIds);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<void>); // monkey patch because of rxjs bug
    }

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addAndRemoveFromRelation(relation: string, entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Rx.Observable<void>;

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addAndRemoveFromRelation(relation: ((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Rx.Observable<void>;

    /**
     * Performs both #addToRelation and #removeFromRelation operations.
     * Should be used when you want quickly and efficiently and and remove a many-to-many relation between two entities.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    addAndRemoveFromRelation(relation: string|((t: Entity) => string|any), entityId: any, addRelatedEntityIds: any[], removeRelatedEntityIds: any[]): Rx.Observable<void> {
        const promiseFn = () => this.repository.addAndRemoveFromRelation(relation as any, entityId, addRelatedEntityIds, removeRelatedEntityIds);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<void>); // monkey patch because of rxjs bug
    }

    /**
     * Removes entity with the given id.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeById(id: any): Rx.Observable<void> {
        const promiseFn = () => this.repository.removeById(id);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<void>); // monkey patch because of rxjs bug
    }

    /**
     * Removes all entities with the given ids.
     * Note that event listeners and event subscribers won't work (and will not send any events) when using this operation.
     */
    removeByIds(ids: any[]): Rx.Observable<void> {
        const promiseFn = () => this.repository.removeByIds(ids);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<void>); // monkey patch because of rxjs bug
    }

}