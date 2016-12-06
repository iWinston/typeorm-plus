// columns

/* export */
function Column(typeOrOptions?: any, options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function CreateDateColumn(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function DiscriminatorColumn(discriminatorOptions: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function PrimaryColumn(typeOrOptions?: any, options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function PrimaryGeneratedColumn(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function UpdateDateColumn(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function VersionColumn(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

// listeners

/* export */
function AfterInsert(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function AfterLoad(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function AfterRemove(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function AfterUpdate(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function BeforeInsert(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function BeforeRemove(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function BeforeUpdate(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function EventSubscriber(): Function {
    return function (object: Object, propertyName: string) {
    };
}

// relations

/* export */
function JoinColumn(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function JoinTable(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function ManyToMany<T>(typeFunction: any, inverseSideOrOptions?: any, options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function ManyToOne<T>(typeFunction: any, inverseSideOrOptions?: any, options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function OneToMany<T>(typeFunction: any, inverseSideOrOptions?: any, options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function OneToOne<T>(typeFunction: any, inverseSideOrOptions?: any, options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function RelationCount<T>(relation: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function RelationId<T>(relation: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

// tables

/* export */
function AbstractTable(): Function {
    return function (object: Object) {
    };
}

/* export */
function ClassTableChild(tableName?: any, options?: any): Function {
    return function (object: Object) {
    };
}

/* export */
function ClosureTable(name?: any, options?: any): Function {
    return function (object: Object) {
    };
}

/* export */
function EmbeddableTable(): Function {
    return function (object: Object) {
    };
}

/* export */
function SingleTableChild(): Function {
    return function (object: Object) {
    };
}

/* export */
function Table(name?: any, options?: any): Function {
    return function (object: Object) {
    };
}

/* export */
function TableInheritance(type?: any): Function {
    return function (object: Object) {
    };
}

// tree

/* export */
function TreeChildren(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function TreeLevelColumn(): Function {
    return function (object: Object, propertyName: string) {
    };
}

/* export */
function TreeParent(options?: any): Function {
    return function (object: Object, propertyName: string) {
    };
}