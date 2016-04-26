import {PropertyMetadata} from "./PropertyMetadata";
import {RelationTypes, RelationType} from "./types/RelationTypes";
import {RelationOptions} from "./options/RelationOptions";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategy";
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
    namingStrategy: NamingStrategyInterface;

    /**
     * Related entity metadata.
     */
    relatedEntityMetadata: EntityMetadata;

    /**
     * Junction entity metadata.
     */
    junctionEntityMetadata: EntityMetadata;

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Relation type.
     */
    readonly relationType: RelationType;

    /**
     * Indicates if this side is an owner of this relation.
     */
    readonly isOwning: boolean;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    readonly isCascadeInsert: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    readonly isCascadeUpdate: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    readonly isCascadeRemove: boolean;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    readonly isNullable: boolean = true;

    /**
     * Old column name.
     */
    readonly oldColumnName: string;

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    readonly onDelete: OnDeleteType;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Column name for this relation.
     */
    private _name: string;

    /**
     * The type of the field.
     */
    private _type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    private _inverseSideProperty: PropertyTypeInFunction<any>;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: RelationMetadataArgs) {
        super(args.target, args.propertyName);
        this.relationType = args.relationType;
        this.isOwning = args.isOwning;
        this._inverseSideProperty = args.inverseSideProperty;

        if (args.options.name)
            this._name = args.options.name;
        if (args.options.cascadeInsert)
            this.isCascadeInsert = args.options.cascadeInsert;
        if (args.options.cascadeUpdate)
            this.isCascadeUpdate = args.options.cascadeUpdate;
        if (args.options.cascadeRemove)
            this.isCascadeRemove = args.options.cascadeRemove;
        if (args.options.oldColumnName)
            this.oldColumnName = args.options.oldColumnName;
        if (args.options.nullable)
            this.isNullable = args.options.nullable;
        if (args.options.onDelete)
            this.onDelete = args.options.onDelete;

        if (!this._type)
            this._type = args.type;
        if (!this._name)
            this._name = args.propertyName;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    get name(): string {
        return this.namingStrategy ? this.namingStrategy.relationName(this._name) : this._name;
    }

    get type(): Function {
        return this._type();
    }

    get inverseSideProperty(): string {
        return this.computeInverseSide(this._inverseSideProperty);
    }

    get inverseRelation(): RelationMetadata {
        return this.relatedEntityMetadata.findRelationWithPropertyName(this.computeInverseSide(this._inverseSideProperty));
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