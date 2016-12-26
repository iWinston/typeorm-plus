import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import { expect } from "chai";

describe("github issues > #134 Error TIME is converted to 'HH-mm' instead of 'HH:mm", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    after(() => closeTestingConnections(connections));



    it("should successfully persist the post with creationDate in HH:mm and return persisted entity", () => Promise.all(connections.map(async connection => {
        const post = new Post();
        post.title = "Hello Post #1";
        post.creationDate = new Date();
        const returnedPost = await connection.entityManager.persist(post);

        expect(returnedPost).not.to.be.empty;
        returnedPost.should.be.equal(post);
    })));



});
