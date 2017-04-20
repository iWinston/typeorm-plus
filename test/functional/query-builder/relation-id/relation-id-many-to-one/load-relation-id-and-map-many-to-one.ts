import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Image} from "./entity/Image";
import {PostCategory} from "./entity/PostCategory";

const should = chai.should();

describe("query builder > load-relation-id-and-map > many-to-one", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load ids when loadRelationIdAndMap used", () => Promise.all(connections.map(async connection => {

        const category1 = new Category();
        category1.name = "cars";
        await connection.entityManager.persist(category1);

        const category2 = new Category();
        category2.name = "airplanes";
        await connection.entityManager.persist(category2);

        const categoryByName1 = new Category();
        categoryByName1.name = "BMW";
        await connection.entityManager.persist(categoryByName1);

        const categoryByName2 = new Category();
        categoryByName2.name = "Boeing";
        await connection.entityManager.persist(categoryByName2);

        const post1 = new Post();
        post1.title = "about BWM";
        post1.category = category1;
        post1.categoryByName = categoryByName1;
        await connection.entityManager.persist(post1);

        const post2 = new Post();
        post2.title = "about Boeing";
        post2.category = category2;
        post2.categoryByName = categoryByName2;
        await connection.entityManager.persist(post2);

        let loadedPosts = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryId", "post.category")
            .loadRelationIdAndMap("post.categoryName", "post.categoryByName")
            .getMany();

        expect(loadedPosts![0].categoryId).to.not.be.empty;
        expect(loadedPosts![0].categoryId).to.be.equal(1);
        expect(loadedPosts![0].categoryName).to.not.be.empty;
        expect(loadedPosts![0].categoryName).to.be.equal("BMW");
        expect(loadedPosts![1].categoryId).to.not.be.empty;
        expect(loadedPosts![1].categoryId).to.be.equal(2);
        expect(loadedPosts![1].categoryName).to.not.be.empty;
        expect(loadedPosts![1].categoryName).to.be.equal("Boeing");

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryId", "post.category")
            .loadRelationIdAndMap("post.categoryName", "post.categoryByName")
            .where("post.id = :id", { id: 1 })
            .getOne();

        expect(loadedPost!.categoryId).to.not.be.empty;
        expect(loadedPost!.categoryId).to.be.equal(1);
        expect(loadedPost!.categoryName).to.not.be.empty;
        expect(loadedPost!.categoryName).to.be.equal("BMW");
    })));

    it("should load ids when loadRelationIdAndMap used and target entity has multiple primary keys", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "cars";
        await connection.entityManager.persist(category);

        const post = new Post();
        post.title = "about cars";
        await connection.entityManager.persist(post);

        const postCategory = new PostCategory();
        postCategory.category = category;
        postCategory.post = post;
        await connection.entityManager.persist(postCategory);

        let loadedPostCategory = await connection.entityManager
            .createQueryBuilder(PostCategory, "postCategory")
            .loadRelationIdAndMap("postCategory.postId", "postCategory.post")
            .loadRelationIdAndMap("postCategory.categoryId", "postCategory.category")
            .getOne();

        expect(loadedPostCategory!.categoryId).to.not.be.empty;
        expect(loadedPostCategory!.categoryId).to.be.equal(1);
        expect(loadedPostCategory!.postId).to.not.be.empty;
        expect(loadedPostCategory!.postId).to.be.equal(1);
    })));

    it("should load ids when loadRelationIdAndMap used on inherit relation and target entity has multiple primary keys", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "cars";
        await connection.entityManager.persist(category);

        const post = new Post();
        post.title = "about cars";
        await connection.entityManager.persist(post);

        const image = new Image();
        image.name = "image #1";
        await connection.entityManager.persist(image);

        const postCategory = new PostCategory();
        postCategory.category = category;
        postCategory.post = post;
        postCategory.image = image;
        await connection.entityManager.persist(postCategory);

        let loadedPostCategory = await connection.entityManager
            .createQueryBuilder(PostCategory, "postCategory")
            .loadRelationIdAndMap("postCategory.imageId", "postCategory.image")
            .getOne();
        expect(loadedPostCategory!.imageId).to.not.be.empty;
        expect(loadedPostCategory!.imageId).to.be.equal(1);
    })));


});