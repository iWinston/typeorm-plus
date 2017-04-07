import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";

const should = chai.should();

describe("query builder > load-relation-id-and-map > one-to-many", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load id when loadRelationIdAndMap used with OneToMany relation", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "cars";
        await connection.entityManager.persist(category);

        const post1 = new Post();
        post1.title = "about BMW";
        post1.category = category;
        await connection.entityManager.persist(post1);

        const post2 = new Post();
        post2.title = "about Audi";
        post2.category = category;
        await connection.entityManager.persist(post2);

        let loadedCategory = await connection.entityManager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.postIds", "category.posts")
            .getOne();

        expect(loadedCategory!.postIds).to.not.be.empty;
        expect(loadedCategory!.postIds.length).to.be.equal(2);
        expect(loadedCategory!.postIds[0]).to.be.equal(1);
        expect(loadedCategory!.postIds[1]).to.be.equal(2);
    })));

    it("should load id when loadRelationIdAndMap used with OneToMany relation and additional condition", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "cars";
        await connection.entityManager.persist(category);

        const post1 = new Post();
        post1.title = "about BMW";
        post1.category = category;
        await connection.entityManager.persist(post1);

        const post2 = new Post();
        post2.title = "about Audi";
        post2.category = category;
        await connection.entityManager.persist(post2);

        let loadedCategory = await connection.entityManager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.postIds", "category.posts", "posts", qb => qb.andWhere("posts.id = :postId", { postId: 1 }))
            .getOne();

        expect(loadedCategory!.postIds).to.not.be.empty;
        expect(loadedCategory!.postIds.length).to.be.equal(1);
        expect(loadedCategory!.postIds[0]).to.be.equal(1);
    })));

});