import {RelationType, RelationTypes} from "./types/RelationTypes";
import {EntityMetadata} from "./EntityMetadata";
import {ForeignKeyMetadata, OnDeleteType} from "./ForeignKeyMetadata";
import {RelationMetadataArgs} from "../metadata-args/RelationMetadataArgs";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ColumnMetadata} from "./ColumnMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";

/**
 * Function that returns a type of the field. Returned value must be a class used on the relation.
 */
export type RelationTypeInFunction = ((type?: any) => Function)|Function|string; // todo: |string ?


/**
 * Contains the name of the property of the object, or the function that returns this name.
 */
export type PropertyTypeInFunction<T> = string|((t: T) => string|any);


/**
 * Contains all information about some entity's relation.
 */
export class RelationMetadata {

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
    readonly target: Function|string;

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    /**
     * Indicates if this is a parent (can be only many-to-one relation) relation in the tree tables.
     */
    readonly isTreeParent: boolean = false;

    /**
     * Indicates if this is a children (can be only one-to-many relation) relation in the tree tables.
     */
    readonly isTreeChildren: boolean = false;

    /**
     * Relation type.
     */
    readonly relationType: RelationType;

    /**
     * Indicates if this relation will be a primary key.
     * Can be used only for many-to-one and owner one-to-one relations.
     */
    readonly isPrimary: boolean;

    /**
     * Indicates if this relation will be lazily loaded.
     */
    readonly isLazy: boolean;

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
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    readonly onDelete: OnDeleteType;

    /**
     * The real reflected property type.
     */
    // readonly propertyType: any;

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
    // Constructor
    // ---------------------------------------------------------------------

    constructor(entityMetadata: EntityMetadata, args: RelationMetadataArgs) {
        this.entityMetadata = entityMetadata;
        this.target = args.target;
        this.propertyName = args.propertyName;
        this.relationType = args.relationType;

        if (args.inverseSideProperty)
            this._inverseSideProperty = args.inverseSideProperty;
        // if (args.propertyType)
        //     this.propertyType = args.propertyType;
        if (args.isLazy !== undefined)
            this.isLazy = args.isLazy;
        if (args.options.cascadeInsert || args.options.cascadeAll)
            this.isCascadeInsert = true;
        if (args.options.cascadeUpdate || args.options.cascadeAll)
            this.isCascadeUpdate = true;
        if (args.options.cascadeRemove || args.options.cascadeAll)
            this.isCascadeRemove = true;
        if (args.options.nullable !== undefined)
            this.isNullable = args.options.nullable;
        if (args.options.onDelete)
            this.onDelete = args.options.onDelete;
        if (args.options.primary !== undefined)
            this.isPrimary = args.options.primary;
        if (args.isTreeParent)
            this.isTreeParent = true;
        if (args.isTreeChildren)
            this.isTreeChildren = true;

        if (!this._type)
            this._type = args.type;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Gets relation's entity target.
     * Original target returns target of the class where relation is.
     * This class can be an abstract class, but relation even is from that class,
     * but its more related to a specific entity. That's why we need this field.
     */
    get entityTarget(): Function|string {
        return this.entityMetadata.target;
    }

    /**
     * Gets the name of column in the database.
     * //Cannot be used with many-to-many relations since they don't have a column in the database.
     * //Also only owning sides of the relations have this property.
     *
     * @deprecated use joinColumn.name or table.joinColumn.name instead
     */
    get name(): string {
        // if (!this.isOwning || this.isManyToMany)

        if (this.isOwning) {
            if (this.isManyToMany) {
                return this.joinColumns[0].name;
            } else if (this.foreignKeys[0] && this.foreignKeys[0].columns) {
                return this.foreignKeys[0].columns[0].name;
            }

        } else if (this.hasInverseSide) {
            if (this.inverseRelation.isManyToMany) {
                return this.inverseRelation.inverseJoinColumns[0].name;
            } else if (this.inverseRelation.foreignKeys[0] && this.inverseRelation.foreignKeys[0].columns && this.inverseRelation.foreignKeys[0].columns[0].referencedColumn) {
                return this.inverseRelation.foreignKeys[0].columns[0].referencedColumn.fullName; // todo: [0] is temporary!!
            }
        }

        throw new Error(`Relation name cannot be retrieved.`);
    }

    /**
     * Gets full path to this column property (including column property name).
     * Full path is relevant when column is used in embeds (one or multiple nested).
     * For example it will return "counters.subcounters.likes".
     * If property is not in embeds then it returns just property name of the column.
     *
     * @stable
     */
    get propertyPath(): string {
        if (!this.embeddedMetadata || !this.embeddedMetadata.parentPropertyNames.length)
            return this.propertyName;

        return this.embeddedMetadata.parentPropertyNames.join(".") + "." + this.propertyName;
    }

    /**
     * Join table name.
     */
    get joinTableName(): string {
        return this.junctionEntityMetadata.tableName;
    }

    /**
     * Join table columns.
     */
    get joinColumns(): ColumnMetadata[] {
        if (!this.isOwning)
            throw new Error(`Inverse join columns are only supported from owning side`);
        // if (!this.foreignKeys[0])
        //     return [];

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
     * Gets the name of column to which this relation is referenced.
     * //Cannot be used with many-to-many relations since all referenced are in the junction table.
     * //Also only owning sides of the relations have this property.
     *
     * @deprecated Use joinTable or joinColumn directly where needed, because this method it too much confusing

    get referencedColumnName(): string {

        if (this.isOwning) {
            if (this.joinTable) {
                return this.joinTable.referencedColumn.fullName;

            } else if (this.joinColumn) {
                return this.joinColumn.referencedColumn.fullName;
            }

        } else if (this.hasInverseSide) {
            if (this.inverseRelation.joinTable) {
                return this.inverseRelation.joinTable.inverseReferencedColumn.fullName;
            } else if (this.inverseRelation.joinColumn) {
                return this.inverseRelation.joinColumn.name; // todo: didn't get this logic here
            }
        }

        // this should not be possible, but anyway throw error
        throw new Error(`Cannot get referenced column name of the relation ${this.entityMetadata.name}#${this.name}`);
    } */

    /**
     * Gets the column to which this relation is referenced.
     *
     * @deprecated Use joinTable or joinColumn directly where needed, because this method it too much confusing

    get referencedColumn(): ColumnMetadata {
        if (this.isOwning) {
            if (this.joinTable) {
                return this.joinTable.referencedColumn;

            } else if (this.joinColumn) {
                return this.joinColumn.referencedColumn;
            }

        } else if (this.hasInverseSide) {
            if (this.inverseRelation.joinTable) {
                return this.inverseRelation.joinTable.inverseReferencedColumn;
            } else if (this.inverseRelation.joinColumn) {
                return this.inverseRelation.joinColumn.referencedColumn;
            }
        }

        // this should not be possible, but anyway throw error
        throw new Error(`Cannot get referenced column of the relation ${this.entityMetadata.name}#${this.name}`);
    } */

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
        return this.relationType === RelationTypes.ONE_TO_ONE;
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
        return this.relationType === RelationTypes.ONE_TO_MANY;
    }

    /**
     * Checks if this relation's type is "many-to-one".
     */
    get isManyToOne(): boolean {
        return this.relationType === RelationTypes.MANY_TO_ONE;
    }

    /**
     * Checks if this relation's type is "many-to-many".
     */
    get isManyToMany(): boolean {
        return this.relationType === RelationTypes.MANY_TO_MANY;
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

        } else if (this.isTreeParent && this.entityMetadata.hasTreeChildrenRelation) {
            return this.entityMetadata.treeChildrenRelation.propertyName;

        } else if (this.isTreeChildren && this.entityMetadata.hasTreeParentRelation) {
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

    /**
     * Gets given entity's relation's value.
     * Using of this method helps to access value of the lazy and non-lazy relations.
     */
    // getValue(entity: ObjectLiteral): any {
    //     return this.isLazy ? entity["__" + this.propertyName + "__"] : entity[this.propertyName];
    // }

    /**
     * Extracts column value from the given entity.
     * If column is in embedded (or recursive embedded) it extracts its value from there.
     *
     * @stable
     */
    getEntityValue(entity: ObjectLiteral): any|undefined {

        // extract column value from embeddeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = this.embeddedMetadata.parentPropertyNames;

            // next we need to access post[data][information][counters][this.propertyName] to get column value from the counters
            // this recursive function takes array of generated property names and gets the post[data][information][counters] embed
            const extractEmbeddedColumnValue = (propertyNames: string[], value: ObjectLiteral): any => {
                const propertyName = propertyNames.shift();
                return propertyName ? extractEmbeddedColumnValue(propertyNames, value[propertyName]) : value;
            };

            // once we get nested embed object we get its column, e.g. post[data][information][counters][this.propertyName]
            const embeddedObject = extractEmbeddedColumnValue(propertyNames, entity);
            return embeddedObject ? embeddedObject[this.isLazy ? "__" + this.propertyName + "__" : this.propertyName] : undefined;

        } else { // no embeds - no problems. Simply return column name by property name of the entity
            return entity[this.isLazy ? "__" + this.propertyName + "__" : this.propertyName];
        }
    }

    /**
     * Sets given entity's relation's value.
     * Using of this method helps to set entity relation's value of the lazy and non-lazy relations.
     */
    setEntityValue(entity: ObjectLiteral, value: any): void {
        const propertyName = this.isLazy ? "__" + this.propertyName + "__" : this.propertyName;

        if (this.embeddedMetadata) {

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const extractEmbeddedColumnValue = (embeddedMetadatas: EmbeddedMetadata[], map: ObjectLiteral): any => {
                // if (!object[embeddedMetadata.propertyName])
                //     object[embeddedMetadata.propertyName] = embeddedMetadata.create();

                const embeddedMetadata = embeddedMetadatas.shift();
                if (embeddedMetadata) {
                    if (!map[embeddedMetadata.propertyName])
                        map[embeddedMetadata.propertyName] = embeddedMetadata.create();

                    extractEmbeddedColumnValue(embeddedMetadatas, map[embeddedMetadata.propertyName]);
                    return map;
                }
                map[propertyName] = value;
                return map;
            };
            return extractEmbeddedColumnValue(this.embeddedMetadata.embeddedMetadataTree, entity);

        } else {
            entity[propertyName] = value;
        }
    }

    /**
     * Creates entity id map from the given entity ids array.
     *
     * @stable
     */
    createValueMap(value: any) {

        // extract column value from embeds of entity if column is in embedded
        if (this.embeddedMetadata) {

            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object and return it in a
            // { data: { information: { counters: { id: ... } } } } format

            // first step - we extract all parent properties of the entity relative to this column, e.g. [data, information, counters]
            const propertyNames = this.embeddedMetadata.parentPropertyNames;

            // now need to access post[data][information][counters] to get column value from the counters
            // and on each step we need to create complex literal object, e.g. first { data },
            // then { data: { information } }, then { data: { information: { counters } } },
            // then { data: { information: { counters: [this.propertyName]: entity[data][information][counters][this.propertyName] } } }
            // this recursive function helps doing that
            const extractEmbeddedColumnValue = (propertyNames: string[], map: ObjectLiteral): any => {
                const propertyName = propertyNames.shift();
                if (propertyName) {
                    map[propertyName] = {};
                    extractEmbeddedColumnValue(propertyNames, map[propertyName]);
                    return map;
                }
                map[this.propertyName] = value;
                return map;
            };
            return extractEmbeddedColumnValue(propertyNames, {});

        } else { // no embeds - no problems. Simply return column property name and its value of the entity
            return { [this.propertyName]: value };
        }
    }

    /**
     * todo: lazy relations are not supported here? implement logic?
     *
     * examples:
     *
     * - isOneToOneNotOwner or isOneToMany:
     *  Post has a Category.
     *  Post is owner side.
     *  Category is inverse side.
     *  Post.category is mapped to Category.id
     *
     *  if from Post relation we are passing Category here,
     *  it should return a post.category
     *
     *  @deprecated

    getOwnEntityRelationId(ownEntity: ObjectLiteral): any {
        if (this.isManyToManyOwner) {
            return ownEntity[this.joinTable.referencedColumn.propertyName];

        } else if (this.isManyToManyNotOwner) {
            return ownEntity[this.inverseRelation.joinTable.inverseReferencedColumn.propertyName];

        } else if (this.isOneToOneOwner || this.isManyToOne) {
            return ownEntity[this.joinColumn.propertyName];

        } else if (this.isOneToOneNotOwner || this.isOneToMany) {
            return ownEntity[this.inverseRelation.joinColumn.referencedColumn.propertyName];
        }
    }*/

    /**
     *
     * examples:
     *
     * - isOneToOneNotOwner or isOneToMany:
     *  Post has a Category.
     *  Post is owner side.
     *  Category is inverse side.
     *  Post.category is mapped to Category.id
     *
     *  if from Post relation we are passing Category here,
     *  it should return a category.id
     *
     *  @deprecated Looks like this method does not make sence and does same as getOwnEntityRelationId ?

    getInverseEntityRelationId(inverseEntity: ObjectLiteral): any {
        if (this.isManyToManyOwner) {
            return inverseEntity[this.joinTable.inverseReferencedColumn.propertyName];

        } else if (this.isManyToManyNotOwner) {
            return inverseEntity[this.inverseRelation.joinTable.referencedColumn.propertyName];

        } else if (this.isOneToOneOwner || this.isManyToOne) {
            return inverseEntity[this.joinColumn.referencedColumn.propertyName];

        } else if (this.isOneToOneNotOwner || this.isOneToMany) {
            return inverseEntity[this.inverseRelation.joinColumn.propertyName];
        }
    }*/

    // ---------------------------------------------------------------------
    // Private Methods
    // ---------------------------------------------------------------------

    /**
     * Inverse side set in the relation can be either string - property name of the column on inverse side,
     * either can be a function that accepts a map of properties with the object and returns one of them.
     * Second approach is used to achieve type-safety.
     */
    private computeInverseSide(inverseSide: PropertyTypeInFunction<any>): string {
        const ownerEntityPropertiesMap = this.inverseEntityMetadata.createPropertiesMap();
        if (typeof inverseSide === "function")
            return (<Function> inverseSide)(ownerEntityPropertiesMap);
        if (typeof inverseSide === "string")
            return <string> inverseSide;

        // throw new Error("Cannot compute inverse side of the relation");
        return "";
    }
}