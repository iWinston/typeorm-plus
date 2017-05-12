import "reflect-metadata";
import {Post} from "./entity/Post";
import {Counters} from "./entity/Counters";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Subcounters} from "../embedded-many-to-one-case2/entity/Subcounters";

describe.skip("embedded > embedded-with-special-columns", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should insert, load, update and remove entities with embeddeds when embeds contains special columns (e.g. CreateDateColumn, UpdateDateColumn, VersionColumn", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.id = 1;
        post1.title = "About cars";
        post1.counters = new Counters();
        post1.counters.comments = 1;
        post1.counters.favorites = 2;
        post1.counters.likes = 3;
        post1.counters.subcounters = new Subcounters();
        post1.counters.subcounters.watches = 5;
        await connection.getRepository(Post).persist(post1);

        const post2 = new Post();
        post2.id = 2;
        post2.title = "About airplanes";
        post2.counters = new Counters();
        post2.counters.comments = 2;
        post2.counters.favorites = 3;
        post2.counters.likes = 4;
        post2.counters.subcounters = new Subcounters();
        post2.counters.subcounters.watches = 10;
        await connection.getRepository(Post).persist(post2);

        let loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .orderBy("post.id")
            .getMany();
        console.log(loadedPosts);
        /*expect(loadedPosts[0].should.be.eql(
            {
                id: 1,
                title: "About cars",
                counters: {
                    comments: 1,
                    favorites: 2,
                    likes: 3,
                    subcounters: {
                        version: 1,
                        watches: 5
                    }
                }
            }
        ));
        expect(loadedPosts[1].should.be.eql(
            {
                id: 2,
                title: "About airplanes",
                counters: {
                    comments: 2,
                    favorites: 3,
                    likes: 4,
                    subcounters: {
                        version: 1,
                        watches: 10
                    }
                }
            }
        ));*/
    })));

});
