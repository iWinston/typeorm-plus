import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Connection} from "../../connection/Connection";
import {SubjectCollection} from "../../persistment/subject/SubjectCollection";
import {Subject} from "../../persistment/subject/Subject";

/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 */
export class DatabaseSubjectsLoader {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     */
    async load<Entity extends ObjectLiteral>(subjectCollection: SubjectCollection): Promise<SubjectCollection> {
        const subjects = new SubjectCollection();
        const promises = subjectCollection
            .groupByEntityTargets()
            .map(subjectGroup => {
                const allIds = subjectGroup.subjects.map(subject => subject.mixedId);
                const metadata = this.connection.getMetadata(subjectGroup.target);
                return this.connection
                    .getRepository(subjectGroup.target)
                    .findByIds(allIds, { alias: metadata.table.name, enabledOptions: ["RELATION_ID_VALUES"] })
                    .then(entities => {
                        entities.forEach(entity => {
                            subjects.push(new Subject(metadata, entity));
                        });
                    });
            });

        await Promise.all(promises);

        return subjects;

    }

    loadRemoved(persistedSubjects: SubjectCollection) {

    }

}