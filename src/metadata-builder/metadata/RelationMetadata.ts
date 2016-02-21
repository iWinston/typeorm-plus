import {PropertyMetadata} from "./PropertyMetadata";
import {RelationTypes} from "../types/RelationTypes";
import {RelationOptions} from "../options/RelationOptions";
import {NamingStrategy} from "../../naming-strategy/NamingStrategy";
import {TableMetadata} from "./TableMetadata";
import {EntityMetadata} from "./EntityMetadata";

/**
 * Function that returns a type of the field. Returned value should be some class within which this relation is being created.
 */
export type RelationTypeInFunction = ((type?: any) => Function);

/**
 * Contains the name of the property of the object, or the function that returns this name.
 */
export type PropertyTypeInFunction<T> = string|((t: T) => string|any);

/**
 * This metadata interface contains all information about some document's relation.
 */
export class RelationMetadata extends PropertyMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    namingStrategy: NamingStrategy;
    ownerEntityPropertiesMap: Object;

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
    private _relationType: RelationTypes;

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
     * If set to true then it means that related object always will be left-joined when this object is being loaded.
     */
    private _isAlwaysLeftJoin: boolean;

    /**
     * If set to true then it means that related object always will be inner-joined when this object is being loaded.
     */
    private _isAlwaysInnerJoin: boolean;

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

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(target: Function,
                propertyName: string,
                relationType: RelationTypes,
                type: RelationTypeInFunction,
                inverseSideProperty: PropertyTypeInFunction<any>,
                isOwning: boolean,
                options: RelationOptions) {
        super(target, propertyName);
        this._relationType = relationType;
        this._type = type;
        this._isOwning = isOwning;
        this._inverseSideProperty = inverseSideProperty;

        if (options.name)
            this._name = options.name;
        if (options.isAlwaysInnerJoin)
            this._isAlwaysInnerJoin = options.isAlwaysInnerJoin;
        if (options.isAlwaysLeftJoin)
            this._isAlwaysLeftJoin = options.isAlwaysLeftJoin;
        if (options.isCascadeInsert)
            this._isCascadeInsert = options.isCascadeInsert;
        if (options.isCascadeUpdate)
            this._isCascadeUpdate = options.isCascadeUpdate;
        if (options.isCascadeRemove)
            this._isCascadeRemove = options.isCascadeRemove;
        if (options.oldColumnName)
            this._oldColumnName = options.oldColumnName;
        if (options.isNullable)
            this._isNullable = options.isNullable;

        if (!this._name)
            this._name = propertyName;
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

    get relationType(): RelationTypes {
        return this._relationType;
    }

    get type(): Function {
        return this._type();
    }

    get inverseSideProperty(): string {
        return this.computeInverseSide(this._inverseSideProperty);
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

    get isAlwaysLeftJoin(): boolean {
        return this._isAlwaysLeftJoin;
    }

    get isAlwaysInnerJoin(): boolean {
        return this._isAlwaysInnerJoin;
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

    // ---------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------

    private computeInverseSide(inverseSide: PropertyTypeInFunction<any>): string {
        if (typeof inverseSide === "function")
            return (<Function> inverseSide)(this.ownerEntityPropertiesMap);
        if (typeof inverseSide === "string")
            return <string> inverseSide;

        return null;
    }

}