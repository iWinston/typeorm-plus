import {PropertyMetadata} from "./PropertyMetadata";
import {JoinColumnOptions} from "./options/JoinColumnOptions";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {RelationMetadata} from "./RelationMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {JoinColumnMetadataArgs} from "./args/JoinColumnMetadataArgs";

/**
 */
export class JoinColumnMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Relation - owner of this join column metadata.
     */
    relation: RelationMetadata;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Join column name.
     */
    private readonly _name: string;
    
    /**
     * Join column referenced column name.
     */
    private readonly _referencedColumnName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(metadata: JoinColumnMetadataArgs) {
        super(metadata.target, metadata.propertyName);
        
        if (metadata.options.name)
            this._name = metadata.options.name;
        if (metadata.options.referencedColumnName)
            this._referencedColumnName = metadata.options.referencedColumnName;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Join column name.
     */
    get name() {
        return this.relation.entityMetadata.namingStrategy.joinColumnInverseSideName(this._name, this.relation.propertyName);
    }

    /**
     * Referenced join column.
     */
    get referencedColumn(): ColumnMetadata {
        if (this._referencedColumnName) {
            const referencedColumn = this.relation.inverseEntityMetadata.columns.find(column => column.name === this._referencedColumnName);
            if (!referencedColumn)
                throw new Error(`Referenced column ${this._referencedColumnName} was not found in entity ${this.name}`);
        }

        return this.relation.inverseEntityMetadata.primaryColumn;
    }
    
}