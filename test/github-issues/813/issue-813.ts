import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("github issues > #813 order by must support functions", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work perfectly", () => Promise.all(connections.map(async connection => {

        const post = new Post();
        post.title = "About order by";
        await connection.manager.save(post);

        const posts = await connection.createQueryBuilder(Post, "post")
            .orderBy("RAND()")
            .getMany();

        posts.should.be.eql([{
            id: 1,
            title: "About order by"
        }]);

    })));

    it("should work perfectly with pagination as well", () => Promise.all(connections.map(async connection => {

        const post = new Post();
        post.title = "About order by";
        await connection.manager.save(post);

        const posts = await connection.createQueryBuilder(Post, "post")
            .orderBy("RAND()")
            .skip(0)
            .take(1)
            .getMany();

        posts.should.be.eql([{
            id: 1,
            title: "About order by"
        }]);

    })));

});
