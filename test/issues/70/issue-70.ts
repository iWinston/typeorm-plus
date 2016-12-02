import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {Category} from "./entity/Category";

describe("github issues > #70 cascade deleting works incorrect", () => {

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

        const category2 = new Category();
        category2.name = "category #2";

        const post = new Post();
        post.title = "Hello Post #1";
        post.categories = [category1, category2];

        // persist post (other are persisted by cascades)
        await connection.entityManager.persist(post);

        // check that all persisted objects exist
        const loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .innerJoinAndSelect("post.categories", "category")
            .orderBy("post.id, category.id")
            .getOne()!;

        const loadedCategories = await connection.entityManager
            .createQueryBuilder(Category, "category")
            .orderBy("category.id")
            .getMany();

        expect(loadedPost!).not.to.be.empty;
        loadedPost!.should.be.eql({
            id: 1,
            title: "Hello Post #1",
            categories: [{
                id: 1,
                name: "category #1"
            }, {
                id: 2,
                name: "category #2"
            }]
        });

        expect(loadedCategories).not.to.be.empty;
        loadedCategories.should.be.eql([{
            id: 1,
            name: "category #1"
        }, {
            id: 2,
            name: "category #2"
        }]);

        // now remove post. categories should be removed too
        await connection.entityManager.remove(post);

        // load them again to make sure they are not exist anymore
        const loadedPosts2 = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .getMany();

        const loadedCategories2 = await connection.entityManager
            .createQueryBuilder(Category, "category")
            .getMany();

        expect(loadedPosts2).to.be.empty;
        expect(loadedCategories2).to.be.empty;

    })));

});