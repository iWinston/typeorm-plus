import {PropertyMetadata} from "./PropertyMetadata";
import {RelationTypes, RelationType} from "../types/RelationTypes";
import {RelationOptions} from "../options/RelationOptions";
import {NamingStrategy} from "../../naming-strategy/NamingStrategy";
import {EntityMetadata} from "./EntityMetadata";
import {OnDeleteType} from "./ForeignKeyMetadata";

/**
 * Function that returns a type of the field. Returned value must be a class used on the relation.
 */
export type RelationTypeInFunction = ((type?: any) => Function);

/**
 * Contains the name of the property of the object, or the function that returns this name.
 */
export type PropertyTypeInFunction<T> = string|((t: T) => string|any);

/**
 * Relation metadata constructor arguments.
 */
export interface RelationMetadataArgs {

    /**
     * Class to which this relation is applied.
     */
    target: Function;

    /**
     * Class's property name to which this relation is applied.
     */
    propertyName: string;

    /**
     * Type of relation. Can be one of the value of the RelationTypes class.
     */
    relationType: RelationType;

    /**
     * Type of the relation. This type is in function because of language specifics and problems with recursive
     * referenced classes.
     */
    type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    inverseSideProperty: PropertyTypeInFunction<any>;

    /**
     * Indicates if this relation is owner side of the relation between entities.
     */
    isOwning: boolean;

    /**
     * Additional relation options.
     */
    options: RelationOptions;
}

/**
 * This metadata interface contains all information about some document's relation.
 */
export class RelationMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize column name.
     */
    namingStrategy: NamingStrategy;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Column name for this relation.
     */
    private _name: string;

    /**
     * Relation type.
     */
    private _relationType: RelationType;

    /**
     * The type of the field.
     */
    private _type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    private _inverseSideProperty: PropertyTypeInFunction<any>;

    /**
     * Indicates if this side is an owner of this relation.
     */
    private _isOwning: boolean;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    private _isCascadeInsert: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    private _isCascadeUpdate: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    private _isCascadeRemove: boolean;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    private _isNullable: boolean = true;

    /**
     * Old column name.
     */
    private _oldColumnName: string;

    /**
     * Related entity metadata.
     */
    private _relatedEntityMetadata: EntityMetadata;

    /**
     * Junction entity metadata.
     */
    private _junctionEntityMetadata: EntityMetadata;

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    private _onDelete: OnDeleteType;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: RelationMetadataArgs) {
        super(args.target, args.propertyName);
        this._relationType = args.relationType;
        this._type = args.type;
        this._isOwning = args.isOwning;
        this._inverseSideProperty = args.inverseSideProperty;

        if (args.options.name)
            this._name = args.options.name;
        if (args.options.cascadeInsert)
            this._isCascadeInsert = args.options.cascadeInsert;
        if (args.options.cascadeUpdate)
            this._isCascadeUpdate = args.options.cascadeUpdate;
        if (args.options.cascadeRemove)
            this._isCascadeRemove = args.options.cascadeRemove;
        if (args.options.oldColumnName)
            this._oldColumnName = args.options.oldColumnName;
        if (args.options.nullable)
            this._isNullable = args.options.nullable;
        if (args.options.onDelete)
            this._onDelete = args.options.onDelete;

        if (!this._name)
            this._name = args.propertyName;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    get name(): string {
        return this.namingStrategy ? this.namingStrategy.relationName(this._name) : this._name;
    }
    
    get relatedEntityMetadata(): EntityMetadata {
        return this._relatedEntityMetadata;
    }
    
    set relatedEntityMetadata(metadata: EntityMetadata) {
        this._relatedEntityMetadata = metadata;
    }

    get junctionEntityMetadata(): EntityMetadata {
        return this._junctionEntityMetadata;
    }
    
    set junctionEntityMetadata(metadata: EntityMetadata) {
        this._junctionEntityMetadata = metadata;
    }

    get relationType(): RelationType {
        return this._relationType;
    }

    get type(): Function {
        return this._type();
    }

    get inverseSideProperty(): string {
        return this.computeInverseSide(this._inverseSideProperty);
    }

    get inverseRelation(): RelationMetadata {
        return this._relatedEntityMetadata.findRelationWithPropertyName(this.computeInverseSide(this._inverseSideProperty));
    }

    get isOwning(): boolean {
        return this._isOwning;
    }

    get isCascadeInsert(): boolean {
        return this._isCascadeInsert;
    }

    get isCascadeUpdate(): boolean {
        return this._isCascadeUpdate;
    }

    get isCascadeRemove(): boolean {
        return this._isCascadeRemove;
    }

    get isOneToOne(): boolean {
        return this.relationType === RelationTypes.ONE_TO_ONE;
    }

    get isOneToMany(): boolean {
        return this.relationType === RelationTypes.ONE_TO_MANY;
    }

    get isManyToOne(): boolean {
        return this.relationType === RelationTypes.MANY_TO_ONE;
    }

    get isManyToMany(): boolean {
        return this.relationType === RelationTypes.MANY_TO_MANY;
    }

    get isNullable(): boolean {
        return this._isNullable;
    }

    get oldColumnName(): string {
        return this._oldColumnName;
    }

    get onDelete(): OnDeleteType {
        return this._onDelete;
    }

    // ---------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------

    private computeInverseSide(inverseSide: PropertyTypeInFunction<any>): string {
        const ownerEntityPropertiesMap = this.relatedEntityMetadata.createPropertiesMap();
        if (typeof inverseSide === "function")
            return (<Function> inverseSide)(ownerEntityPropertiesMap);
        if (typeof inverseSide === "string")
            return <string> inverseSide;

        // throw new Error("Cannot compute inverse side of the relation");
        return "";
    }

}