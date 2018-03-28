import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("repository > decrement method", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should decrement value", () => Promise.all(connections.map(async connection => {

        // save few dummy posts
        const post1 = new Post();
        post1.id = 1;
        post1.title = "post #1";
        post1.counter = 2;

        const post2 = new Post();
        post2.id = 2;
        post2.title = "post #2";
        post2.counter = 5;
        await connection.manager.save([post1, post2]);

        // decrement counter of post 1
        await connection
            .getRepository(Post)
            .decrement({ id: 1 }, "counter", 1);

        // decrement counter of post 2
        await connection
            .manager
            .decrement(Post, { id: 2 }, "counter", 2);

        // load and check counter
        const loadedPost1 = await connection.manager.findOne(Post, 1);
        loadedPost1!.counter.should.be.equal(1);

        const loadedPost2 = await connection.manager.findOne(Post, 2);
        loadedPost2!.counter.should.be.equal(3);
    })));

    it("should throw an error if column property path was not found", () => Promise.all(connections.map(async connection => {

        // save few dummy posts
        const post1 = new Post();
        post1.id = 1;
        post1.title = "post #1";
        post1.counter = 1;

        const post2 = new Post();
        post2.id = 2;
        post2.title = "post #2";
        post2.counter = 1;
        await connection.manager.save([post1, post2]);

        // decrement counter of post 1
        await connection
            .getRepository(Post)
            .decrement({ id: 1 }, "counters", 1)
            .should.be.rejected;

    })));

});
