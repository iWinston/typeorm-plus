import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../src/connection/Connection";
import {Post} from "../../sample/sample1-simple-entity/entity/Post";
import {closeConnections, reloadDatabases, setupTestingConnections} from "../utils/test-utils";

describe("insertion", function() {

    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [Post],
        schemaCreate: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications: persist
    // -------------------------------------------------------------------------

    it("basic insert functionality", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);

        let newPost = new Post();
        newPost.text = "Hello post";
        newPost.title = "this is post title";
        newPost.likesCount = 0;
        const savedPost = await postRepository.persist(newPost);

        savedPost.should.be.equal(newPost);
        expect(savedPost.id).not.to.be.empty;

        const insertedPost = await postRepository.findOneById(savedPost.id);
        insertedPost.should.be.eql({
            id: savedPost.id,
            text: "Hello post",
            title: "this is post title",
            likesCount: 0
        });
    })));

});