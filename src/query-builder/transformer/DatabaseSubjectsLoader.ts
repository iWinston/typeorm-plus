import {ObjectLiteral} from "../../common/ObjectLiteral";
import {Connection} from "../../connection/Connection";
import {SubjectCollection} from "../../persistment/subject/SubjectCollection";

/**
 * Transforms plain old javascript object
 * Entity is constructed based on its entity metadata.
 */
export class DatabaseSubjectsLoader {

    constructor(protected connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    async transform<Entity extends ObjectLiteral>(subjectCollection: SubjectCollection): Promise<void> {

        const arrayOfEntities = await Promise.all(subjectCollection
            .groupByEntityTargets()
            .map(subjectGroup => {
                const allIds = subjectGroup.subjects.map(subject => subject.id);
                const repository = this.connection.getRepository(subjectGroup.target);
                return repository.findByIds(allIds);
            }));

    }

}