import {PropertyMetadata} from "./PropertyMetadata";
import {RelationMetadata} from "./RelationMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {JoinColumnMetadataArgs} from "./args/JoinColumnMetadataArgs";

/**
 * JoinColumnMetadata contains all information about relation's join column.
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
    private readonly _name: string|undefined;
    
    /**
     * Join column referenced column name.
     */
    private readonly referencedColumnName: string|undefined;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: JoinColumnMetadataArgs) {
        super(args.target, args.propertyName);
        this._name = args.name;
        this.referencedColumnName = args.referencedColumnName;
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
        if (this.referencedColumnName) {
            const referencedColumn = this.relation.inverseEntityMetadata.columns.find(column => column.name === this.referencedColumnName);
            if (!referencedColumn)
                throw new Error(`Referenced column ${this.referencedColumnName} was not found in entity ${this.name}`);
        }

        return this.relation.inverseEntityMetadata.primaryColumn;
    }
    
}