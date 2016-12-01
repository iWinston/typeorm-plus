import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {Category} from "./entity/Category";

describe("github issues > #47 wrong sql syntax when loading lazy relation", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    it("should persist successfully and return persisted entity", () => Promise.all(connections.map(async connection => {

        // create objects to save
        const category1 = new Category();
        category1.name = "category #1";

        const post1 = new Post();
        post1.title = "Hello Post #1";
        post1.category = Promise.resolve(category1);

        const category2 = new Category();
        category2.name = "category #2";

        const post2 = new Post();
        post2.title = "Hello Post #2";
        post2.category = Promise.resolve(category2);

        // persist
        await connection.entityManager.persist(category1);
        await connection.entityManager.persist(post1);
        await connection.entityManager.persist(category2);
        await connection.entityManager.persist(post2);

        // check that all persisted objects exist
        const loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .getMany();

        const loadedCategory1 = await loadedPost[0].category;
        expect(loadedCategory1!).not.to.be.empty;
        loadedCategory1!.should.be.eql({
            id: 1,
            name: "category #1"
        });

        const loadedCategory2 = await loadedPost[1].category;
        expect(loadedCategory2!).not.to.be.empty;
        loadedCategory2!.should.be.eql({
            id: 2,
            name: "category #2"
        });

        const loadedPosts1 = await loadedCategory1.posts;
        expect(loadedPosts1!).not.to.be.empty;
        loadedPosts1!.should.be.eql([{
            id: 1,
            title: "Hello Post #1"
        }]);

        const loadedPosts2 = await loadedCategory2.posts;
        expect(loadedPosts2!).not.to.be.empty;
        loadedPosts2!.should.be.eql([{
            id: 2,
            title: "Hello Post #2"
        }]);

        // todo: need to test somehow how query is being generated, or how many raw data is returned

    })));

});