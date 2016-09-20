import * as Rx from "rxjs/Rx";
import {ReactiveRepository} from "./ReactiveRepository";
import {TreeRepository} from "./TreeRepository";
import {QueryBuilder} from "../query-builder/QueryBuilder";

/**
 * Tree repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 * This version of TreeRepository is using rxjs library and Observables instead of promises.
 *
 * @see TreeRepository
 * @see Repository
 */
export class TreeReactiveRepository<Entity> extends ReactiveRepository<Entity> {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected repository: TreeRepository<Entity>) {
        super(repository);
    }
    
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Roots are entities that have no ancestors. Finds them all.
     */
    findRoots(): Rx.Observable<Entity[]> {
        const promiseFn = () => this.repository.findRoots();
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<Entity[]>); // monkey patch because of rxjs bug
    }

    /**
     * Creates a query builder used to get descendants of the entities in a tree.
     */
    createDescendantsQueryBuilder(alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        return this.repository.createDescendantsQueryBuilder(alias, closureTableAlias, entity);
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them all in a flat array.
     */
    findDescendants(entity: Entity): Rx.Observable<Entity[]> {
        const promiseFn = () => this.repository.findDescendants(entity);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<Entity[]>); // monkey patch because of rxjs bug
    }

    /**
     * Gets all children (descendants) of the given entity. Returns them in a tree - nested into each other.
     */
    findDescendantsTree(entity: Entity): Rx.Observable<Entity> {
        const promiseFn = () => this.repository.findDescendantsTree(entity);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<Entity>); // monkey patch because of rxjs bug
    }

    /**
     * Gets number of descendants of the entity.
     */
    countDescendants(entity: Entity): Rx.Observable<number> {
        const promiseFn = () => this.repository.countDescendants(entity);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<number>); // monkey patch because of rxjs bug
    }

    /**
     * Creates a query builder used to get ancestors of the entities in the tree.
     */
    createAncestorsQueryBuilder(alias: string, closureTableAlias: string, entity: Entity): QueryBuilder<Entity> {
        return this.repository.createAncestorsQueryBuilder(alias, closureTableAlias, entity);
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them all in a flat array.
     */
    findAncestors(entity: Entity): Rx.Observable<Entity[]> {
        const promiseFn = () => this.repository.findAncestors(entity);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<Entity[]>); // monkey patch because of rxjs bug
    }

    /**
     * Gets all parents (ancestors) of the given entity. Returns them in a tree - nested into each other.
     */
    findAncestorsTree(entity: Entity): Rx.Observable<Entity> {
        const promiseFn = () => this.repository.findAncestorsTree(entity);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<Entity>); // monkey patch because of rxjs bug
    }

    /**
     * Gets number of ancestors of the entity.
     */
    countAncestors(entity: Entity): Rx.Observable<number> {
        const promiseFn = () => this.repository.countAncestors(entity);
        return Rx.Observable.fromPromise((promiseFn as any) as Promise<number>); // monkey patch because of rxjs bug
    }

    /**
     * Moves entity to the children of then given entity.
     *
     move(entity: Entity, to: Entity): Rx.Observable<void> {
        return Rx.Observable.fromPromise(() => this.repository.move(entity, to));
     } */


}