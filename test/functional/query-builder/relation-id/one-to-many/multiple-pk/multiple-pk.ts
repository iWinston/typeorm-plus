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

const should = chai.should();

describe("query builder > relation-id > one-to-many > multiple-pk", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load ids when both entities have multiple primary keys", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.id = 1;
        category1.code = 1;
        category1.name = "cars";
        await connection.manager.persist(category1);

        const category2 = new Category();
        category2.id = 2;
        category2.code = 2;
        category2.name = "BMW";
        await connection.manager.persist(category2);

        const category3 = new Category();
        category3.id = 3;
        category3.code = 1;
        category3.name = "airplanes";
        await connection.manager.persist(category3);

        const category4 = new Category();
        category4.id = 4;
        category4.code = 2;
        category4.name = "Boeing";
        await connection.manager.persist(category4);

        const post1 = new Post();
        post1.id = 1;
        post1.authorId = 1;
        post1.title = "About BMW";
        post1.categories = [category1, category2];
        await connection.manager.persist(post1);

        const post2 = new Post();
        post2.id = 2;
        post2.authorId = 1;
        post2.title = "About Boeing";
        post2.categories = [category3, category4];
        await connection.manager.persist(post2);

        const loadedPosts = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .getMany();

        expect(loadedPosts[0].categoryIds).to.not.be.empty;
        expect(loadedPosts[0].categoryIds[0]).to.be.eql({ id: 1, code: 1 });
        expect(loadedPosts[0].categoryIds[1]).to.be.eql({ id: 2, code: 2 });
        expect(loadedPosts[1].categoryIds).to.not.be.empty;
        expect(loadedPosts[1].categoryIds[0]).to.be.eql({ id: 3, code: 1 });
        expect(loadedPosts[1].categoryIds[1]).to.be.eql({ id: 4, code: 2 });

         const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .where("post.id = :id", { id: 1 })
            .andWhere("post.authorId = :authorId", { authorId: 1 })
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds[0]).to.be.eql({ id: 1, code: 1 });
        expect(loadedPost!.categoryIds[1]).to.be.eql({ id: 2, code: 2 });

    })));

});