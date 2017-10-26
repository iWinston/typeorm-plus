import {Subject} from "./Subject";

/**
 * Validates subjects for errors.
 * Subject cannot be at the same time inserted and updated, removed and inserted, removed and updated.
 */
export class SubjectValidator {

    validate(subjects: Subject[]) {
        subjects.forEach(subject => {
            if (subject.mustBeInserted && subject.mustBeRemoved)
                throw new Error(`Removed entity ${subject.metadata.name} is also scheduled for insert operation. This looks like ORM problem. Please report a github issue.`);

            if (subject.mustBeUpdated && subject.mustBeRemoved)
                throw new Error(`Removed entity "${subject.metadata.name}" is also scheduled for update operation. ` +
                    `Make sure you are not updating and removing same object (note that update or remove may be executed by cascade operations).`);

            if (subject.mustBeInserted && subject.mustBeUpdated)
                throw new Error(`Inserted entity ${subject.metadata.name} is also scheduled for updated operation. This looks like ORM problem. Please report a github issue.`);
        });
    }

}
