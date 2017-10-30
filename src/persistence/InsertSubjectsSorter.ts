import {Subject} from "./Subject";
import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 * Orders insert subjects in proper order (using topological sorting) to make sure insert operations are executed
 * in a proper order.
 */
export class InsertSubjectsSorter {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    order(insertSubjects: Subject[]): Subject[] {

        // extract unique metadatas from the given subjects
        const metadatas: EntityMetadata[] = [];
        insertSubjects.forEach(subject => {
            if (metadatas.indexOf(subject.metadata) === -1)
                metadatas.push(subject.metadata);
        });

        // if there are no metadatas it probably mean there is no subjects... we don't have to do anything here
        if (!metadatas.length)
            return insertSubjects;


        const dependencies: string[][] = [];
        metadatas.forEach(metadata => {
            metadata.relationsWithJoinColumns.forEach(relation => {
                if (relation.isNullable)
                    return;

                dependencies.push([metadata.targetName, relation.inverseEntityMetadata.targetName]);
            });
        });

        const sortedEntityTargets = this.toposort(dependencies).reverse();

        const newInsertedSubjects: Subject[] = [];
        sortedEntityTargets.forEach(sortedEntityTarget => {
            const entityTargetSubjects = insertSubjects.filter(subject => subject.metadata.targetName === sortedEntityTarget);
            newInsertedSubjects.push(...entityTargetSubjects);
            entityTargetSubjects.forEach(entityTargetSubject => insertSubjects.splice(insertSubjects.indexOf(entityTargetSubject), 1));
        });

        const dependencies2: string[][] = [];
        metadatas.forEach(metadata => {
            metadata.relationsWithJoinColumns.forEach(relation => {
                dependencies2.push([metadata.targetName, relation.inverseEntityMetadata.targetName]);
            });
        });

        const sortedEntityTargets2 = this.toposort(dependencies2).reverse();

        const newInsertedSubjects2: Subject[] = [];
        sortedEntityTargets2.forEach(sortedEntityTarget => {
            const entityTargetSubjects = insertSubjects.filter(subject => subject.metadata.targetName === sortedEntityTarget);
            newInsertedSubjects2.push(...entityTargetSubjects);
            entityTargetSubjects.forEach(entityTargetSubject => insertSubjects.splice(insertSubjects.indexOf(entityTargetSubject), 1));
        });

        newInsertedSubjects.push(...newInsertedSubjects2);
        newInsertedSubjects.push(...insertSubjects);

        return newInsertedSubjects;
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

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