// todo: create @Primary() that can also be simple and composite. multiple usages of @Primary means multiple keys should be used
// todo: maybe also need to support using @Primary on classes
// todo: @Primary() can be used with @Column, it will give same result as @PrimaryColumn
// todo: also @Primary can be used on relations (manyToOne and oneToOne)
// todo: it should be possible to make combinations of primary keys on columns and relational columns
// todo: primary keys should be used on junction tables

export function Primary() {
    return function (object: Object, propertyName: string) {
        /*const args: IndexMetadataArgs = {
            name: name,
            target: object.constructor,
            columns: [propertyName],
            unique: options && options.unique ? true : false
        };
        getMetadataArgsStorage().indices.add(args);*/
    };
}
