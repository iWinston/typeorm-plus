import {PropertyTypeInFunction, RelationMetadata, RelationTypeInFunction} from "../metadata/RelationMetadata";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {EmbeddedMetadata} from "../metadata/EmbeddedMetadata";
import {ForeignKeyMetadata, OnDeleteType} from "../metadata/ForeignKeyMetadata";
import {RelationType} from "../metadata/types/RelationTypes";
import {ColumnMetadata} from "../metadata/ColumnMetadata";

/**
 * Contains all information about some entity's relation.
 */
export class RelationMetadataBuilder {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Its own entity metadata.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata where this relation is.
     * If this relation is not in embed then this property value is undefined.
     */
    embeddedMetadata: EmbeddedMetadata;

    /**
     * Related entity metadata.
     */
    inverseEntityMetadata: EntityMetadata;

    /**
     * Junction entity metadata.
     */
    junctionEntityMetadata: EntityMetadata;

    foreignKeys: ForeignKeyMetadata[] = [];

    // ---------------------------------------------------------------------
    // Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    target: Function|string;

    /**
     * Gets relation's entity target.
     * Original target returns target of the class where relation is.
     * This class can be an abstract class, but relation even is from that class,
     * but its more related to a specific entity. That's why we need this field.
     *
     * Note: this property is available only after relation metadata complete build
     */
    entityTarget: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    propertyName: string;

    /**
     * Indicates if this is a parent (can be only many-to-one relation) relation in the tree tables.
     */
    isTreeParent: boolean = false;

    /**
     * Indicates if this is a children (can be only one-to-many relation) relation in the tree tables.
     */
    isTreeChildren: boolean = false;

    /**
     * Relation type.
     */
    relationType: RelationType;

    /**
     * Indicates if this relation will be a primary key.
     * Can be used only for many-to-one and owner one-to-one relations.
     */
    isPrimary: boolean;

    /**
     * Indicates if this relation will be lazily loaded.
     */
    isLazy: boolean;

    /**
     * If set to true then it means that related object can be allowed to be inserted to the db.
     */
    isCascadeInsert: boolean;

    /**
     * If set to true then it means that related object can be allowed to be updated in the db.
     */
    isCascadeUpdate: boolean;

    /**
     * If set to true then it means that related object can be allowed to be remove from the db.
     */
    isCascadeRemove: boolean;

    /**
     * Indicates if relation column value can be nullable or not.
     */
    isNullable: boolean = true;

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    onDelete: OnDeleteType;

    /**
     * The real reflected property type.
     */
    // propertyType: any;

    /**
     * Join table name.
     */
    joinTableName: string;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * The type of the field.
     */
    private _type: RelationTypeInFunction;

    /**
     * Inverse side of the relation.
     */
    private _inverseSideProperty: PropertyTypeInFunction<any>;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    private relationMetadata: RelationMetadata;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor() {
        this.relationMetadata = new RelationMetadata({} as any);
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Gets full path to this column property (including relation name).
     * Full path is relevant when column is used in embeds (one or multiple nested).
     * For example it will return "counters.subcounters.likes".
     * If property is not in embeds then it returns just property name of the column.
     */
    get propertyPath(): string {
        if (!this.embeddedMetadata || !this.embeddedMetadata.parentPropertyNames.length)
            return this.propertyName;

        return this.embeddedMetadata.parentPropertyNames.join(".") + "." + this.propertyName;
    }

    /**
     * Join table columns.
     */
    get joinColumns(): ColumnMetadata[] {
        if (!this.isOwning)
            throw new Error(`Inverse join columns are only supported from owning side`);

        return this.foreignKeys[0].columns;
    }

    /**
     * Join table columns.
     */
    get inverseJoinColumns(): ColumnMetadata[] {
        if (!this.isOwning)
            throw new Error(`Inverse join columns are only supported from owning side`);

        if (!this.isManyToMany)
            throw new Error(`Inverse join columns are not supported by non-many-to-many relations`);

        return this.foreignKeys[1].columns;
    }

    /**
     * Gets the property's type to which this relation is applied.
     */
    get type(): Function|string { // todo: when this can be a string?
        return this._type instanceof Function ? (this._type as () => any)() : this._type;
    }

    /**
     * Indicates if this side is an owner of this relation.
     */
    get isOwning() {
        return  !!(this.isManyToOne ||
                (this.isManyToMany && this.foreignKeys.length > 0) ||
                (this.isOneToOne && this.foreignKeys.length > 0));
    }

    /**
     * Checks if this relation's type is "one-to-one".
     */
    get isOneToOne(): boolean {
        return this.relationType === "one-to-one";
    }

    /**
     * Checks if this relation is owner side of the "one-to-one" relation.
     * Owner side means this side of relation has a join column in the table.
     */
    get isOneToOneOwner(): boolean {
        return this.isOneToOne && this.isOwning;
    }

    /**
     * Checks if this relation has a join column (e.g. is it many-to-one or one-to-one owner side).
     */
    get isWithJoinColumn(): boolean {
        return this.isManyToOne || this.isOneToOneOwner;
    }

    /**
     * Checks if this relation is NOT owner side of the "one-to-one" relation.
     * NOT owner side means this side of relation does not have a join column in the table.
     */
    get isOneToOneNotOwner(): boolean {
        return this.isOneToOne && !this.isOwning;
    }

    /**
     * Checks if this relation's type is "one-to-many".
     */
    get isOneToMany(): boolean {
        return this.relationType === "one-to-many";
    }

    /**
     * Checks if this relation's type is "many-to-one".
     */
    get isManyToOne(): boolean {
        return this.relationType === "many-to-one";
    }

    /**
     * Checks if this relation's type is "many-to-many".
     */
    get isManyToMany(): boolean {
        return this.relationType === "many-to-many";
    }

    /**
     * Checks if this relation's type is "many-to-many", and is owner side of the relationship.
     * Owner side means this side of relation has a join table.
     */
    get isManyToManyOwner(): boolean {
        return this.isManyToMany && this.isOwning;
    }

    /**
     * Checks if this relation's type is "many-to-many", and is NOT owner side of the relationship.
     * Not owner side means this side of relation does not have a join table.
     */
    get isManyToManyNotOwner(): boolean {
        return this.isManyToMany && !this.isOwning;
    }

    /**
     * Checks if inverse side is specified by a relation.
     */
    get hasInverseSide(): boolean {
        return this.inverseEntityMetadata && this.inverseEntityMetadata.hasRelationWithPropertyPath(this.inverseSidePropertyPath);
    }

    /**
     * Gets the property name of the inverse side of the relation.
     */
    get inverseSidePropertyPath(): string { // todo: should be called inverseSidePropertyName ?

        if (this._inverseSideProperty) {
            return this.computeInverseSide(this._inverseSideProperty);

        } else if (this.isTreeParent && this.entityMetadata.treeChildrenRelation) {
            return this.entityMetadata.treeChildrenRelation.propertyName;

        } else if (this.isTreeChildren && this.entityMetadata.treeParentRelation) {
            return this.entityMetadata.treeParentRelation.propertyName;

        }

        return "";
    }

    /**
     * Gets the relation metadata of the inverse side of this relation.
     */
    get inverseRelation(): RelationMetadata {
        const relation = this.inverseEntityMetadata.findRelationWithPropertyPath(this.inverseSidePropertyPath);
        if (!relation)
            throw new Error(`Inverse side was not found in the relation ${this.entityMetadata.name}#${this.inverseSidePropertyPath}`);

        return relation;
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    build(): RelationMetadata {
        const metadata = this.relationMetadata;
        metadata.relationType = this.relationType;
        metadata.entityMetadata = this.entityMetadata;
        metadata.inverseEntityMetadata = this.inverseEntityMetadata;
        metadata.junctionEntityMetadata = this.junctionEntityMetadata;
        metadata.embeddedMetadata = this.embeddedMetadata;
        metadata.foreignKeys = this.foreignKeys;
        // metadata.entityTarget = this.entityMetadata.target;
        metadata.propertyPath = this.propertyPath;
        metadata.joinColumns = this.joinColumns;
        metadata.inverseJoinColumns = this.inverseJoinColumns;
        metadata.type = this.type;
        metadata.isOwning = this.isOwning;
        metadata.isOneToOne = this.isOneToOne;
        metadata.isOneToOneOwner = this.isOneToOneOwner;
        metadata.isWithJoinColumn = this.isWithJoinColumn;
        metadata.isOneToOneNotOwner = this.isOneToOneNotOwner;
        metadata.isOneToMany = this.isOneToMany;
        metadata.isManyToOne = this.isManyToOne;
        metadata.isManyToMany = this.isManyToMany;
        metadata.isManyToManyOwner = this.isManyToManyOwner;
        metadata.isManyToManyNotOwner = this.isManyToManyNotOwner;
        metadata.hasInverseSide = this.hasInverseSide;
        metadata.propertyPath = this.propertyPath;
        metadata.inverseSidePropertyPath = this.inverseSidePropertyPath;
        metadata.inverseRelation = this.inverseRelation;

        if (this.junctionEntityMetadata) {
            metadata.junctionEntityMetadata = this.junctionEntityMetadata;
            metadata.joinTableName = this.junctionEntityMetadata.tableName;
        }
        return metadata;
    }

    // ---------------------------------------------------------------------
    // Protected Methods
    // ---------------------------------------------------------------------

    /**
     * Inverse side set in the relation can be either string - property name of the column on inverse side,
     * either can be a function that accepts a map of properties with the object and returns one of them.
     * Second approach is used to achieve type-safety.
     */
    protected computeInverseSide(inverseSide: PropertyTypeInFunction<any>): string {
        const ownerEntityPropertiesMap = this.inverseEntityMetadata.propertiesMap;
        if (typeof inverseSide === "function")
            return (<Function> inverseSide)(ownerEntityPropertiesMap);
        if (typeof inverseSide === "string")
            return <string> inverseSide;

        // throw new Error("Cannot compute inverse side of the relation");
        return "";
    }

}