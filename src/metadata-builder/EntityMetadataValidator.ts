import {UsingJoinTableIsNotAllowedError} from "./error/UsingJoinTableIsNotAllowedError";
import {UsingJoinTableOnlyOnOneSideAllowedError} from "./error/UsingJoinTableOnlyOnOneSideAllowedError";
import {UsingJoinColumnIsNotAllowedError} from "./error/UsingJoinColumnIsNotAllowedError";
import {UsingJoinColumnOnlyOnOneSideAllowedError} from "./error/UsingJoinColumnOnlyOnOneSideAllowedError";
import {MissingJoinColumnError} from "./error/MissingJoinColumnError";
import {MissingJoinTableError} from "./error/MissingJoinTableError";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {MissingPrimaryColumnError} from "./error/MissingPrimaryColumnError";

/**
 * Validates built entity metadatas.
 * 
 * @internal
 */
export class EntityMetadataValidator {

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Validates all given entity metadatas.
     */
    validateMany(entityMetadatas: EntityMetadata[]) {
        entityMetadatas.forEach(entityMetadata => this.validate(entityMetadata, entityMetadatas));
    }

    /**
     * Validates given entity metadata.
     */
    validate(entityMetadata: EntityMetadata, allEntityMetadatas: EntityMetadata[]) {

        // check if table metadata has an id
        if (!entityMetadata.table.isClassTableChild && !entityMetadata.primaryColumns.length)
            throw new MissingPrimaryColumnError(entityMetadata);

        // validate if table is using inheritance it has a discriminator
        // also validate if discriminator values are not empty and not repeated
        if (entityMetadata.inheritanceType === "single-table") {
            if (!entityMetadata.hasDiscriminatorColumn)
                throw new Error(`Entity ${entityMetadata.name} using single-table inheritance, it should also have a discriminator column. Did you forget to put @DiscriminatorColumn decorator?`);

            if (["", undefined, null].indexOf(entityMetadata.discriminatorValue) !== -1)
                throw new Error(`Entity ${entityMetadata.name} has empty discriminator value. Discriminator value should not be empty.`);

            const sameDiscriminatorValueEntityMetadata = allEntityMetadatas.find(metadata => {
                return metadata !== entityMetadata && metadata.discriminatorValue === entityMetadata.discriminatorValue;
            });
            if (sameDiscriminatorValueEntityMetadata)
                throw new Error(`Entities ${entityMetadata.name} and ${sameDiscriminatorValueEntityMetadata.name} as equal discriminator values. Make sure their discriminator values are not equal using @DiscriminatorValue decorator.`);
        }

        // validate relations
        entityMetadata.relations.forEach(relation => {

            // check join tables:
            // using JoinTable is possible only on one side of the many-to-many relation
            if (relation.joinTable) {
                if (!relation.isManyToMany)
                    throw new UsingJoinTableIsNotAllowedError(entityMetadata, relation);

                // if there is inverse side of the relation, then check if it does not have join table too
                if (relation.hasInverseSide && relation.inverseRelation.joinTable)
                    throw new UsingJoinTableOnlyOnOneSideAllowedError(entityMetadata, relation);
            }

            // check join columns:
            // using JoinColumn is possible only on one side of the relation and on one-to-one, many-to-one relation types
            // first check if relation is one-to-one or many-to-one
            if (relation.joinColumn) {

                // join column can be applied only on one-to-one and many-to-one relations
                if (!relation.isOneToOne && !relation.isManyToOne)
                    throw new UsingJoinColumnIsNotAllowedError(entityMetadata, relation);

                // if there is inverse side of the relation, then check if it does not have join table too
                if (relation.hasInverseSide && relation.inverseRelation.joinColumn && relation.isOneToOne)
                    throw new UsingJoinColumnOnlyOnOneSideAllowedError(entityMetadata, relation);

            }

            // if its a one-to-one relation and JoinColumn is missing on both sides of the relation
            // or its one-side relation without JoinColumn we should give an error
            if (!relation.joinColumn && relation.isOneToOne && (!relation.hasInverseSide || !relation.inverseRelation.joinColumn))
                throw new MissingJoinColumnError(entityMetadata, relation);

            // if its a many-to-many relation and JoinTable is missing on both sides of the relation
            // or its one-side relation without JoinTable we should give an error
            if (!relation.joinTable && relation.isManyToMany && (!relation.hasInverseSide || !relation.inverseRelation.joinTable))
                throw new MissingJoinTableError(entityMetadata, relation);
            
            
            // todo: validate if its one-to-one and side which does not have join column MUST have inverse side
            // todo: validate if its many-to-many and side which does not have join table MUST have inverse side
            // todo: if there is a relation, and inverse side is specified only on one side, shall we give error
            // todo: with message like: "Inverse side is specified only on one side of the relationship. Specify on other side too to prevent confusion".
            
        });
    }
}