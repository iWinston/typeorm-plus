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

    it("should load ids when loadRelationIdAndMap used with ManyToOne relation", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "cars";
        await connection.entityManager.persist(category);

        const post = new Post();
        post.title = "about cars";
        post.category = category;
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryId", "post.category")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.categoryId).to.not.be.empty;
        expect(loadedPost!.categoryId).to.be.equal(1);
    })));

    it("should load ids when loadRelationIdAndMap used with ManyToOne relation and target entity has multiple primary keys", () => Promise.all(connections.map(async connection => {

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

    it("should load ids when loadRelationIdAndMap used with ManyToOne relation and target entity has multiple primary keys", () => Promise.all(connections.map(async connection => {

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