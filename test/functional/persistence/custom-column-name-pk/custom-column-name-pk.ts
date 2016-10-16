import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe("persistence > cascade operations with custom name", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    describe("cascade update", function() {

        it("should remove relation", () => Promise.all(connections.map(async connection => {

            // create first post and category and save them
            const post1 = new Post();
            post1.title = "Hello Post #1";

            const category1 = new Category();
            category1.name = "Category saved by cascades #1";
            category1.posts = [post1];

            await connection.entityManager.persist(category1);

            category1.posts = [];

            await connection.entityManager.persist(category1);

            // now check
            const posts = await connection.entityManager.find(Post, {
                alias: "post",
                leftJoinAndSelect: {
                    category: "post.category"
                },
                orderBy: {
                    "post.id": "ASC"
                }
            });

            posts.should.be.eql([{
                id: 1,
                title: "Hello Post #1"
            }]);
        })));

    });

});