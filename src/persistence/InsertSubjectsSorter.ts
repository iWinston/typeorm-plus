import {Subject} from "./Subject";
import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 * Orders insert subjects in proper order (using topological sorting) to make sure insert operations are executed
 * in a proper order.
 */
export class InsertSubjectsSorter {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Insert subjects needs to be sorted.
     */
    subjects: Subject[];

    /**
     * Unique list of entity metadatas of this subject.
     */
    metadatas: EntityMetadata[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(insertSubjects: Subject[]) {
        this.subjects = [...insertSubjects]; // copy insert subjects to prevent changing of sent array
        this.metadatas = this.getUniqueMetadatas(this.subjects);
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    order(): Subject[] {

        // if there are no metadatas it probably mean there is no subjects... we don't have to do anything here
        if (!this.metadatas.length)
            return this.subjects;

        const nonNullableDependencies = this.getNonNullableDependencies();
        const sortedNonNullableEntityTargets = this.toposort(nonNullableDependencies).reverse();

        const newInsertedSubjects: Subject[] = [];
        sortedNonNullableEntityTargets.forEach(sortedEntityTarget => {
            const entityTargetSubjects = this.subjects.filter(subject => subject.metadata.targetName === sortedEntityTarget);
            newInsertedSubjects.push(...entityTargetSubjects);
            entityTargetSubjects.forEach(entityTargetSubject => this.subjects.splice(this.subjects.indexOf(entityTargetSubject), 1));
        });

        const otherDependencies: string[][] = this.getDependencies();
        const sortedOtherEntityTargets = this.toposort(otherDependencies).reverse();

        const newInsertedSubjects2: Subject[] = [];
        sortedOtherEntityTargets.forEach(sortedEntityTarget => {
            const entityTargetSubjects = this.subjects.filter(subject => subject.metadata.targetName === sortedEntityTarget);
            newInsertedSubjects2.push(...entityTargetSubjects);
            entityTargetSubjects.forEach(entityTargetSubject => this.subjects.splice(this.subjects.indexOf(entityTargetSubject), 1));
        });

        newInsertedSubjects.push(...newInsertedSubjects2);
        newInsertedSubjects.push(...this.subjects);

        return newInsertedSubjects;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Extracts all unique metadatas from the given subjects.
     */
    protected getUniqueMetadatas(subjects: Subject[]) {
        const metadatas: EntityMetadata[] = [];
        subjects.forEach(subject => {
            if (metadatas.indexOf(subject.metadata) === -1)
                metadatas.push(subject.metadata);
        });
        return metadatas;
    }

    /**
     * Gets dependency tree for all entity metadatas with non-nullable relations.
     * We need to execute insertions first for entities which non-nullable relations.
     */
    protected getNonNullableDependencies(): string[][] {
        return this.metadatas.reduce((dependencies, metadata) => {
            metadata.relationsWithJoinColumns.forEach(relation => {
                if (relation.isNullable)
                    return;

                dependencies.push([metadata.targetName, relation.inverseEntityMetadata.targetName]);
            });
            return dependencies;
        }, [] as string[][]);
    }

    /**
     * Gets dependency tree for all entity metadatas with non-nullable relations.
     * We need to execute insertions first for entities which non-nullable relations.
     */
    protected getDependencies(): string[][] {
        return this.metadatas.reduce((dependencies, metadata) => {
            metadata.relationsWithJoinColumns.forEach(relation => {

                // if relation is self-referenced we skip it
                if (relation.inverseEntityMetadata === metadata)
                    return;

                dependencies.push([metadata.targetName, relation.inverseEntityMetadata.targetName]);
            });
            return dependencies;
        }, [] as string[][]);
    }

    /**
     * Implements topological sort.
     * Sorts given graph.
     *
     * Algorithm is kindly taken from https://github.com/marcelklehr/toposort repository.
     */
    protected toposort(edges: any[][]) {

        function uniqueNodes(arr: any[]) {
            let res = [];
            for (let i = 0, len = arr.length; i < len; i++) {
                let edge: any = arr[i];
                if (res.indexOf(edge[0]) < 0) res.push(edge[0]);
                if (res.indexOf(edge[1]) < 0) res.push(edge[1]);
            }
            return res;
        }

        const nodes = uniqueNodes(edges);
        let cursor = nodes.length
            , sorted = new Array(cursor)
            , visited: any = {}
            , i = cursor;

        while (i--) {
            if (!visited[i]) visit(nodes[i], i, []);
        }

        function visit(node: any, i: number, predecessors: any[]) {
            if (predecessors.indexOf(node) >= 0) {
                throw new Error("Cyclic dependency: " + JSON.stringify(node));
            }

            if (!~nodes.indexOf(node)) {
                throw new Error("Found unknown node. Make sure to provided all involved nodes. Unknown node: " + JSON.stringify(node));
            }

            if (visited[i]) return;
            visited[i] = true;

            // outgoing edges
            let outgoing = edges.filter(function(edge){
                return edge[0] === node;
            });
            if (i = outgoing.length) {
                let preds = predecessors.concat(node);
                do {
                    let child = outgoing[--i][1];
                    visit(child, nodes.indexOf(child), preds);
                } while (i);
            }

            sorted[--cursor] = node;
        }

        return sorted;
    }

}