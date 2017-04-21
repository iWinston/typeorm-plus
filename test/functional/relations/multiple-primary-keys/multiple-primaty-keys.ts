import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

const should = chai.should();

describe.only("relations > multiple-primary-keys", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load related entity when multiple primary keys used", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.name = "cars";
        category1.type = "common-category";
        await connection.entityManager.persist(category1);

        const category2 = new Category();
        category2.name = "airplanes";
        category2.type = "common-category";
        await connection.entityManager.persist(category2);

        const post1 = new Post();
        post1.title = "About cars #1";
        post1.category = category1;
        await connection.entityManager.persist(post1);

        const post2 = new Post();
        post2.title = "About cars #2";
        post2.category = category2;
        await connection.entityManager.persist(post2);

        let loadedPosts = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.category", "category")
            .getMany();

        expect(loadedPosts![0].category).to.not.be.empty;
        expect(loadedPosts![0].category.type).to.be.equal("common-category");
        expect(loadedPosts![1].category).to.not.be.empty;
        expect(loadedPosts![1].category.type).to.be.equal("common-category");

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.category", "category")
            .where("post.id = :id", { id: 1 })
            .getOne();

        expect(loadedPost!.category).to.not.be.empty;
        expect(loadedPost!.category.type).to.be.equal("common-category");

    })));

});