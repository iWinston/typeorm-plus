import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../../../utils/test-utils";
import {Connection} from "../../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Counters} from "./entity/Counters";

const should = chai.should();

describe("query builder > relation-id > many-to-many > embedded", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load ids when RelationId decorator used in embedded table", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.name = "cars";
        await connection.manager.persist(category1);

        const category2 = new Category();
        category2.name = "BMW";
        await connection.manager.persist(category2);

        const category3 = new Category();
        category3.name = "airplanes";
        await connection.manager.persist(category3);

        const category4 = new Category();
        category4.name = "Boeing";
        await connection.manager.persist(category4);

        const post1 = new Post();
        post1.title = "About BMW";
        post1.counters = new Counters();
        post1.counters.likes = 1;
        post1.counters.comments = 2;
        post1.counters.favorites = 3;
        post1.counters.categories = [category1, category2];
        await connection.manager.persist(post1);

        const post2 = new Post();
        post2.title = "About Boeing";
        post2.counters = new Counters();
        post2.counters.likes = 3;
        post2.counters.comments = 4;
        post2.counters.favorites = 5;
        post2.counters.categories = [category3, category4];
        await connection.manager.persist(post2);

        const loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.counters.categoryIds", "post.counters.categories")
            .orderBy("post.id")
            .getMany();

        expect(loadedPosts[0].should.be.eql(
            {
                id: 1,
                title: "About BMW",
                counters: {
                    likes: 1,
                    comments: 2,
                    favorites: 3,
                    categoryIds: [1, 2]
                }
            }
        ));
        expect(loadedPosts[1].should.be.eql(
            {
                id: 2,
                title: "About Boeing",
                counters: {
                    likes: 3,
                    comments: 4,
                    favorites: 5,
                    categoryIds: [3, 4]
                }
            }
        ));

    })));

});