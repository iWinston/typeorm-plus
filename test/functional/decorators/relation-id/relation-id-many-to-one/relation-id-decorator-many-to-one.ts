import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

const should = chai.should();

describe("decorators > relation-id-decorator > many-to-one", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load ids when RelationId decorator used with ManyToOne relation", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "kids";
        await connection.entityManager.persist(category);

        const category2 = new Category();
        category2.name = "cars";
        await connection.entityManager.persist(category2);

        const post = new Post();
        post.title = "about kids";
        post.category = category;
        await connection.entityManager.persist(post);

        const post2 = new Post();
        post2.title = "about cars";
        post2.category = category2;
        await connection.entityManager.persist(post2);

        let loadedPosts = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .getMany();

        expect(loadedPosts![0].categoryId).to.not.be.empty;
        expect(loadedPosts![0].categoryId).to.be.equal(1);
        expect(loadedPosts![1].categoryId).to.not.be.empty;
        expect(loadedPosts![1].categoryId).to.be.equal(2);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.categoryId).to.not.be.empty;
        expect(loadedPost!.categoryId).to.be.equal(1);
    })));

});