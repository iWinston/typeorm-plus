import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Tag} from "./entity/Tag";

const should = chai.should();

describe("relations > custom-referenced-column-name", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("many-to-one", () => {

        it("should load related entity when relation use custom referenced column name", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            await connection.entityManager.persist(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            await connection.entityManager.persist(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.category = category1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.category = category2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .getMany();

            expect(loadedPosts![0].categoryName).to.not.be.empty;
            expect(loadedPosts![0].categoryName).to.be.equal("cars");
            expect(loadedPosts![1].categoryName).to.not.be.empty;
            expect(loadedPosts![1].categoryName).to.be.equal("airplanes");

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.categoryName).to.not.be.empty;
            expect(loadedPost!.categoryName).to.be.equal("cars");

        })));

        it("should load related entity when relation defined without reference column name", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            await connection.entityManager.persist(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            await connection.entityManager.persist(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.categoryWithoutRefColName = category1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.categoryWithoutRefColName = category2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .getMany();

            expect(loadedPosts![0].categoryId).to.be.equal(1);
            expect(loadedPosts![1].categoryId).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.categoryId).to.be.equal(1);

        })));

        it("should load related entity when relation defined without column name", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            await connection.entityManager.persist(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            await connection.entityManager.persist(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.categoryWithoutColName = category1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.categoryWithoutColName = category2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithoutColName", "categoryWithoutColName")
                .getMany();

            expect(loadedPosts![0].categoryWithoutColName.id).to.be.equal(1);
            expect(loadedPosts![1].categoryWithoutColName.id).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithoutColName", "categoryWithoutColName")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.categoryWithoutColName.id).to.be.equal(1);

        })));

        it("should load related entity when relation defined without reference column name and relation does not have relation column in entity", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            await connection.entityManager.persist(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            await connection.entityManager.persist(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.categoryWithoutRefColName2 = category1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.categoryWithoutRefColName2 = category2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithoutRefColName2", "categoryWithoutRefColName2")
                .getMany();

            expect(loadedPosts![0].categoryWithoutRefColName2).to.not.be.empty;
            expect(loadedPosts![0].categoryWithoutRefColName2.id).to.be.equal(1);
            expect(loadedPosts![1].categoryWithoutRefColName2).to.not.be.empty;
            expect(loadedPosts![1].categoryWithoutRefColName2.id).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.categoryWithoutRefColName2", "categoryWithoutRefColName2")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.categoryWithoutRefColName2).to.not.be.empty;
            expect(loadedPost!.categoryWithoutRefColName2.id).to.be.equal(1);

        })));

        it("should persist relation when relation sets via join column", () => Promise.all(connections.map(async connection => {

            const category1 = new Category();
            category1.name = "cars";
            await connection.entityManager.persist(category1);

            const category2 = new Category();
            category2.name = "airplanes";
            await connection.entityManager.persist(category2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.categoryName = "cars";
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.categoryName = "airplanes";
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.category", "category")
                .getMany();

            expect(loadedPosts![0].category).to.not.be.empty;
            expect(loadedPosts![0].category.id).to.be.equal(1);
            expect(loadedPosts![1].category).to.not.be.empty;
            expect(loadedPosts![1].category.id).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.category", "category")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.category).to.not.be.empty;
            expect(loadedPost!.category.id).to.be.equal(1);

        })));
    });

    describe("one-to-one", () => {

        it("should load related entity when relation use custom referenced column name", () => Promise.all(connections.map(async connection => {

            const tag1 = new Tag();
            tag1.name = "tag #1";
            await connection.entityManager.persist(tag1);

            const tag2 = new Tag();
            tag2.name = "tag #2";
            await connection.entityManager.persist(tag2);

            const post1 = new Post();
            post1.title = "Post #1";
            post1.tag = tag1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "Post #2";
            post2.tag = tag2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .getMany();

            expect(loadedPosts![0].tagName).to.not.be.empty;
            expect(loadedPosts![0].tagName).to.be.equal("tag #1");
            expect(loadedPosts![1].tagName).to.not.be.empty;
            expect(loadedPosts![1].tagName).to.be.equal("tag #2");

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.tagName).to.not.be.empty;
            expect(loadedPost!.tagName).to.be.equal("tag #1");

        })));

        it("should load related entity when relation defined without reference column name", () => Promise.all(connections.map(async connection => {

            const tag1 = new Tag();
            tag1.name = "tag #1";
            await connection.entityManager.persist(tag1);

            const tag2 = new Tag();
            tag2.name = "tag #2";
            await connection.entityManager.persist(tag2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.tagWithoutRefColName = tag1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.tagWithoutRefColName = tag2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .getMany();

            expect(loadedPosts![0].tagId).to.be.equal(1);
            expect(loadedPosts![1].tagId).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.tagId).to.be.equal(1);

        })));

        it("should load related entity when relation defined without column name", () => Promise.all(connections.map(async connection => {

            const tag1 = new Tag();
            tag1.name = "tag #1";
            await connection.entityManager.persist(tag1);

            const tag2 = new Tag();
            tag2.name = "tag #2";
            await connection.entityManager.persist(tag2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.tagWithoutColName = tag1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.tagWithoutColName = tag2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.tagWithoutColName", "tagWithoutColName")
                .getMany();

            expect(loadedPosts![0].tagWithoutColName.id).to.be.equal(1);
            expect(loadedPosts![1].tagWithoutColName.id).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.tagWithoutColName", "tagWithoutColName")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.tagWithoutColName.id).to.be.equal(1);

        })));

        it("should load related entity when relation defined without reference column name and relation does not have relation column in entity", () => Promise.all(connections.map(async connection => {

            const tag1 = new Tag();
            tag1.name = "tag #1";
            await connection.entityManager.persist(tag1);

            const tag2 = new Tag();
            tag2.name = "tag #2";
            await connection.entityManager.persist(tag2);

            const post1 = new Post();
            post1.title = "About BMW";
            post1.tagWithoutRefColName2 = tag1;
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "About Boeing";
            post2.tagWithoutRefColName2 = tag2;
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.tagWithoutRefColName2", "tagWithoutRefColName2")
                .getMany();

            expect(loadedPosts![0].tagWithoutRefColName2).to.not.be.empty;
            expect(loadedPosts![0].tagWithoutRefColName2.id).to.be.equal(1);
            expect(loadedPosts![1].tagWithoutRefColName2).to.not.be.empty;
            expect(loadedPosts![1].tagWithoutRefColName2.id).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.tagWithoutRefColName2", "tagWithoutRefColName2")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.tagWithoutRefColName2).to.not.be.empty;
            expect(loadedPost!.tagWithoutRefColName2.id).to.be.equal(1);

        })));

        it("should persist relation when relation sets via join column", () => Promise.all(connections.map(async connection => {

            const tag1 = new Tag();
            tag1.name = "tag #1";
            await connection.entityManager.persist(tag1);

            const tag2 = new Tag();
            tag2.name = "tag #2";
            await connection.entityManager.persist(tag2);

            const post1 = new Post();
            post1.title = "Post #1";
            post1.tagName = "tag #1";
            await connection.entityManager.persist(post1);

            const post2 = new Post();
            post2.title = "Post #2";
            post2.tagName = "tag #2";
            await connection.entityManager.persist(post2);

            const loadedPosts = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.tag", "tag")
                .getMany();

            expect(loadedPosts![0].tag).to.not.be.empty;
            expect(loadedPosts![0].tag.id).to.be.equal(1);
            expect(loadedPosts![1].tag).to.not.be.empty;
            expect(loadedPosts![1].tag.id).to.be.equal(2);

            const loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .leftJoinAndSelect("post.tag", "category")
                .where("post.id = :id", { id: 1 })
                .getOne();

            expect(loadedPost!.tag).to.not.be.empty;
            expect(loadedPost!.tag.id).to.be.equal(1);

        })));
    });

});