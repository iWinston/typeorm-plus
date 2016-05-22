import {PropertyMetadata} from "./PropertyMetadata";
import {JoinTableOptions} from "./options/JoinTableOptions";
import {RelationMetadata} from "./RelationMetadata";
import {ColumnMetadata} from "./ColumnMetadata";

/**
 */
export class JoinTableMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Relation - owner of this join table metadata.
     */
    relation: RelationMetadata;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Join table name.
     */
    private readonly _name: string;

    /**
     * Join column name.
     */
    private readonly _joinColumnName: string;

    /**
     * Join column referenced column name.
     */
    private readonly _joinColumnReferencedColumnName: string;

    /**
     * Join column name of the inverse side.
     */
    private readonly _inverseJoinColumnName: string;

    /**
     * Join column referenced column name of the inverse side.
     */
    private readonly _inverseJoinColumnReferencedColumnName: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function, propertyName: string, options: JoinTableOptions) {
        super(target, propertyName);
        
        if (options.name)
            this._name = options.name;
        
        if (options.joinColumn) {
            if (options.joinColumn.name)
                this._joinColumnName = options.joinColumn.name;
            if (options.joinColumn.referencedColumnName)
                this._joinColumnReferencedColumnName = options.joinColumn.referencedColumnName;
        }
        
        if (options.inverseJoinColumn) {
            if (options.inverseJoinColumn.name)
                this._inverseJoinColumnName = options.inverseJoinColumn.name;
            if (options.inverseJoinColumn.referencedColumnName)
                this._inverseJoinColumnReferencedColumnName = options.inverseJoinColumn.referencedColumnName;
        }
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Join table name.
     */
    get name() {
        if (this._name)
            return this._name;
        
        return this.relation.entityMetadata.namingStrategy.joinTableName(
            this.relation.entityMetadata.table.name,
            this.relation.inverseEntityMetadata.table.name,
            this.relation.name,
            this.relation.hasInverseSide ? this.relation.inverseRelation.name : "",
            this.referencedColumn.name,
            this.inverseReferencedColumn.name
        );
    }

    /**
     * Join column name.
     */
    get joinColumnName() {
        if (this._joinColumnName)
            return this._joinColumnName;
        
        return this.relation
            .entityMetadata
            .namingStrategy
            .joinTableColumnName(
                this.relation.entityMetadata.table.name, 
                this.referencedColumn.name,
                this.relation.inverseEntityMetadata.table.name, 
                this.inverseReferencedColumn.name
            );
    }

    /**
     * Join column name of the inverse side.
     */
    get inverseJoinColumnName() {
        if (this._inverseJoinColumnName)
            return this._inverseJoinColumnName;
        
        return this.relation
            .entityMetadata
            .namingStrategy
            .joinTableInverseColumnName(
                this.relation.inverseEntityMetadata.table.name,
                this.inverseReferencedColumn.name,
                this.relation.entityMetadata.table.name,
                this.referencedColumn.name
            );
    }

    /**
     * Referenced join column.
     */
    get referencedColumn(): ColumnMetadata {
        if (this._joinColumnReferencedColumnName) {
            const referencedColumn = this.relation.entityMetadata.columns.find(column => column.name === this._joinColumnReferencedColumnName);
            if (!referencedColumn)
                throw new Error(`Referenced column ${this._joinColumnReferencedColumnName} was not found in entity ${this.name}`);
            
            return referencedColumn;
        }

        return this.relation.entityMetadata.primaryColumn;
    }

    /**
     * Referenced join column of the inverse side.
     */
    get inverseReferencedColumn(): ColumnMetadata {
        if (this._inverseJoinColumnReferencedColumnName) {
            const referencedColumn = this.relation.inverseEntityMetadata.columns.find(column => column.name === this._inverseJoinColumnReferencedColumnName);
            if (!referencedColumn)
                throw new Error(`Referenced column ${this._inverseJoinColumnReferencedColumnName} was not found in entity ${this.name}`);

            return referencedColumn;
        }

        return this.relation.inverseEntityMetadata.primaryColumn;
    }

}