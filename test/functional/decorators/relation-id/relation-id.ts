import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Tag} from "./entity/Tag";
import {PostWithoutDecorators} from "./entity/PostWithoutDecorators";

const should = chai.should();

describe("QueryBuilder > relation-id", () => {
    
    // todo: make this feature to work with FindOptions
    // todo: also make sure all new qb features to work with FindOptions
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("basic functionality", function() {

        it("should load id when RelationId decorator used with ManyToOne relation", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "kids";
            await connection.entityManager.persist(tag);
            
            const post = new Post();
            post.title = "about kids";
            post.tag = tag;
            await connection.entityManager.persist(post);

            let loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .where("post.id = :id", { id: post.id })
                .getOne();

            expect(loadedPost!.tagId).to.not.be.empty;
            expect(loadedPost!.tagId).to.be.equal(1);
        })));

        it.skip("should load id when RelationId decorator used with ManyToMany relation", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "kids";

            const category2 = new Category();
            category2.name = "future";

            await Promise.all([
                connection.entityManager.persist(category1),
                connection.entityManager.persist(category2)
            ]);

            const post = new Post();
            post.title = "about kids";
            await connection.entityManager.persist(post);

            let loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .where("post.id = :id", { id: post.id })
                .getOne();

            expect(loadedPost!.categoryIds).to.not.be.empty;
            expect(loadedPost!.categoryIds[0]).to.be.equal(1);
            expect(loadedPost!.categoryIds[1]).to.be.equal(2);
        })));

        it("should not load id when RelationId decorator is not specified", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "kids";

            const category1 = new Category();
            category1.name = "kids";

            const category2 = new Category();
            category2.name = "future";

            await Promise.all([
                connection.entityManager.persist(tag),
                connection.entityManager.persist(category1),
                connection.entityManager.persist(category2)
            ]);

            const post = new PostWithoutDecorators();
            post.title = "about kids";
            post.tag = tag;
            post.categories = [category1, category2];
            await connection.entityManager.persist(post);

            let loadedPost = await connection.entityManager
                .createQueryBuilder(PostWithoutDecorators, "post")
                .leftJoinAndSelect("post.tag", "tag")
                .leftJoinAndSelect("post.categories", "categories")
                .where("post.id = :id", { id: post.id })
                .getOne();

            expect(loadedPost!.tag).to.not.be.empty;
            expect(loadedPost!.tagId).to.be.empty;
            expect(loadedPost!.categories).to.not.be.empty;
            expect(loadedPost!.categoryIds).to.be.empty;

        })));

        it.skip("should load ids when RelationId decorator is not specified and JoinAndMap used", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "kids";

            const category1 = new Category();
            category1.name = "kids";

            const category2 = new Category();
            category2.name = "future";

            await Promise.all([
                connection.entityManager.persist(tag),
                connection.entityManager.persist(category1),
                connection.entityManager.persist(category2)
            ]);

            const post = new PostWithoutDecorators();
            post.title = "about kids";
            post.tag = tag;
            post.categories = [category1, category2];
            await connection.entityManager.persist(post);

            let loadedPost = await connection.entityManager
                .createQueryBuilder(PostWithoutDecorators, "post")
                .loadRelationIdAndMap("post.tagId", "post.tag")
                .loadRelationIdAndMap("post.categoryIds", "post.categories")
                .where("post.id = :id", { id: post.id })
                .getOne();

            expect(loadedPost!.tagId).to.not.be.empty;
            expect(loadedPost!.tagId).to.be.equal(1);
            expect(loadedPost!.categoryIds).to.not.be.empty;
            expect(loadedPost!.categoryIds[0]).to.be.equal(1);
            expect(loadedPost!.categoryIds[1]).to.be.equal(2);

        })));

        it("should load ids when JoinAndMap used with additional condition", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "kids";

            const category2 = new Category();
            category2.name = "future";

            await Promise.all([
                connection.entityManager.persist(category1),
                connection.entityManager.persist(category2)
            ]);

            const post = new PostWithoutDecorators();
            post.title = "about kids";
            post.categories = [category1, category2];
            await connection.entityManager.persist(post);

            let loadedPost = await connection.entityManager
                .createQueryBuilder(PostWithoutDecorators, "post")
                .loadRelationIdAndMap("post.categoryIds", "post.categories", "categories", qb => qb.where("categories.id = :categoryId", { categoryId: 1 }))
                .getOne();
            console.log("post", loadedPost);
            console.log("driver", connection.driver.constructor.name);
            expect(loadedPost!.categoryIds).to.not.be.empty;
            expect(loadedPost!.categoryIds.length).to.be.equal(1);
            expect(loadedPost!.categoryIds[0]).to.be.equal(1);

        })));

    });

});