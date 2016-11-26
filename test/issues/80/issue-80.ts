import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("persistence > general operations", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    it("should persist successfully and return persisted entity", () => Promise.all(connections.map(async connection => {
        const post = new Post();
        post.title = "Hello Post #1";
        const returnedPost = await connection.entityManager.persist(post);

        expect(returnedPost).not.to.be.empty;
        returnedPost.should.be.equal(post);
    })));

    it("should not fail if empty array is given to persist method", () => Promise.all(connections.map(async connection => {
        const posts: Post[] = [];
        const returnedPosts = await connection.entityManager.persist(posts);
        expect(returnedPosts).not.to.be.undefined;
        returnedPosts.should.be.equal(posts);
    })));

});