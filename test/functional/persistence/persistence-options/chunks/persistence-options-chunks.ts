import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
// import {expect} from "chai";

describe.only("persistence > persistence options > chunks", () => {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({ __dirname, enabledDrivers: ["postgres"] }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("should save objects in chunks", () => Promise.all(connections.map(async connection => {
        const posts: Post[] = [];
        for (let i = 0; i < 100000; i++) {
            const post = new Post();
            post.title = "Bakhrom " + i;
            post.description = "Hello" + i;
            posts.push(post);
        }
        await connection.manager.save(posts, { chunk: 10000 });
    })));

});
