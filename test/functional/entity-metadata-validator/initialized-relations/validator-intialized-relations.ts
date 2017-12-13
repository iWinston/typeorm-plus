import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {ConnectionMetadataBuilder} from "../../../../src/connection/ConnectionMetadataBuilder";
import {EntityMetadataValidator} from "../../../../src/metadata-builder/EntityMetadataValidator";
import {expect} from "chai";
import {InitializedRelationError} from "../../../../src/error/InitializedRelationError";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";

describe.only("entity-metadata-validator > initialized relations", () => {

    it("should throw error if relation with initialized array was found", () => {
        const connection = new Connection({ // dummy connection options, connection won't be established anyway
            type: "mysql",
            host: "localhost",
            username: "test",
            password: "test",
            database: "test",
            entities: [Post, Category]
        });
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(connection);
        const entityMetadatas = connectionMetadataBuilder.buildEntityMetadatas([Post, Category], []);
        const entityMetadataValidator = new EntityMetadataValidator();
        expect(() => entityMetadataValidator.validateMany(entityMetadatas, connection.driver)).to.throw(InitializedRelationError);
    });

});