import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Tag} from "./entity/Tag";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Image} from "./entity/Image";

const should = chai.should();

describe("QueryBuilder > relation-id > many-to-many", () => {
    
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

    it("should not load ids when RelationId decorator is not specified", () => Promise.all(connections.map(async connection => {

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

        const post = new Post();
        post.title = "about kids";
        post.tag = tag;
        post.categories = [category1, category2];
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.tag", "tag")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.tag).to.not.be.empty;
        expect(loadedPost!.tagId).to.be.empty;
        expect(loadedPost!.categories).to.not.be.empty;
        expect(loadedPost!.categoryIds).to.be.empty;

    })));

    it("should load ids when loadRelationIdAndMap used on ManyToMany owner side", () => Promise.all(connections.map(async connection => {

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
        post.categories = [category1, category2];
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds[0]).to.be.equal(1);
        expect(loadedPost!.categoryIds[1]).to.be.equal(2);

    })));

    it("should load ids when loadRelationIdAndMap used on ManyToMany owner side without inverse side", () => Promise.all(connections.map(async connection => {

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
        post.subcategories = [category1, category2];
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.subcategories")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds[0]).to.be.equal(1);
        expect(loadedPost!.categoryIds[1]).to.be.equal(2);

    })));

    it("should load ids when loadRelationIdAndMap used on ManyToMany inverse side", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "cars";
        await connection.entityManager.persist(category);

        const post1 = new Post();
        post1.title = "about BMW";
        post1.categories = [category];

        const post2 = new Post();
        post2.title = "about Audi";
        post2.categories = [category];

        await Promise.all([
            connection.entityManager.persist(post1),
            connection.entityManager.persist(post2)
        ]);

        let loadedCategory = await connection.entityManager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.postIds", "category.posts")
            .where("category.id = :id", { id: category.id })
            .getOne();

        expect(loadedCategory!.postIds).to.not.be.empty;
        expect(loadedCategory!.postIds[0]).to.be.equal(1);
        expect(loadedCategory!.postIds[1]).to.be.equal(2);

    })));

    it("should load ids when loadRelationIdAndMap used on ManyToMany owning side with additional condition", () => Promise.all(connections.map(async connection => {

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
        post.categories = [category1, category2];
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.categories", "categories", qb => qb.where("categories.id = :categoryId", { categoryId: 1 }))
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds.length).to.be.equal(1);
        expect(loadedPost!.categoryIds[0]).to.be.equal(1);

    })));

    it("should load ids when loadRelationIdAndMap used on ManyToMany owning side without inverse side and with additional condition", () => Promise.all(connections.map(async connection => {

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
        post.subcategories = [category1, category2];
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.categoryIds", "post.subcategories", "subCategories", qb => qb.where("subCategories.id = :categoryId", { categoryId: 1 }))
            .getOne();

        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds.length).to.be.equal(1);
        expect(loadedPost!.categoryIds[0]).to.be.equal(1);

    })));

    it("should load ids when loadRelationIdAndMap used on ManyToMany inverse side with additional condition", () => Promise.all(connections.map(async connection => {

        const category = new Category();
        category.name = "cars";
        await connection.entityManager.persist(category);

        const post1 = new Post();
        post1.title = "about BMW";
        post1.categories = [category];

        const post2 = new Post();
        post2.title = "about Audi";
        post2.categories = [category];

        await Promise.all([
            connection.entityManager.persist(post1),
            connection.entityManager.persist(post2)
        ]);

        let loadedCategory = await connection.entityManager
            .createQueryBuilder(Category, "category")
            .loadRelationIdAndMap("category.postIds", "category.posts", "posts", qb => qb.where("posts.id = :postId", { postId: 1 }))
            .where("category.id = :id", { id: category.id })
            .getOne();

        expect(loadedCategory!.postIds).to.not.be.empty;
        expect(loadedCategory!.postIds.length).to.be.equal(1);
        expect(loadedCategory!.postIds[0]).to.be.equal(1);

    })));

    it("should load ids when loadRelationIdAndMap used on inherit relation", () => Promise.all(connections.map(async connection => {

        const image1 = new Image();
        image1.name = "photo1";

        const image2 = new Image();
        image2.name = "photo2";

        await Promise.all([
            connection.entityManager.persist(image1),
            connection.entityManager.persist(image2)
        ]);

        const category1 = new Category();
        category1.name = "cars";
        category1.images = [image1, image2];
        await connection.entityManager.persist(category1);

        const category2 = new Category();
        category2.name = "BMW";
        await connection.entityManager.persist(category2);

        const post = new Post();
        post.title = "about BMW";
        post.categories = [category1, category2];
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "categories")
            .loadRelationIdAndMap("post.categoryIds", "post.categories")
            .loadRelationIdAndMap("categories.imageIds", "categories.images")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.categories).to.not.be.empty;
        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds.length).to.be.equal(2);
        expect(loadedPost!.categoryIds[0]).to.be.equal(1);
        expect(loadedPost!.categoryIds[1]).to.be.equal(2);
        expect(loadedPost!.categories[0].imageIds).to.not.be.empty;
        expect(loadedPost!.categories[0].imageIds.length).to.be.equal(2);
        expect(loadedPost!.categories[0].imageIds[0]).to.be.equal(1);
        expect(loadedPost!.categories[0].imageIds[1]).to.be.equal(2);

    })));

    it("should load ids when loadRelationIdAndMap used on inherit relation with additional conditions", () => Promise.all(connections.map(async connection => {

        const image1 = new Image();
        image1.name = "photo1";

        const image2 = new Image();
        image2.name = "photo2";

        await Promise.all([
            connection.entityManager.persist(image1),
            connection.entityManager.persist(image2)
        ]);

        const category1 = new Category();
        category1.name = "cars";
        category1.images = [image1, image2];
        await connection.entityManager.persist(category1);

        const category2 = new Category();
        category2.name = "BMW";
        await connection.entityManager.persist(category2);

        const post = new Post();
        post.title = "about BMW";
        post.categories = [category1, category2];
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "categories")
            .loadRelationIdAndMap("post.categoryIds", "post.categories", "categories2", qb => qb.where("categories2.id = :categoryId", { categoryId: 1 }))
            .loadRelationIdAndMap("categories.imageIds", "categories.images", "images", qb => qb.where("images.id = :imageId", { imageId: 1 }))
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.categories).to.not.be.empty;
        expect(loadedPost!.categoryIds).to.not.be.empty;
        expect(loadedPost!.categoryIds.length).to.be.equal(1);
        expect(loadedPost!.categoryIds[0]).to.be.equal(1);
        expect(loadedPost!.categories[0].imageIds).to.not.be.empty;
        expect(loadedPost!.categories[0].imageIds.length).to.be.equal(1);
        expect(loadedPost!.categories[0].imageIds[0]).to.be.equal(1);

    })));

});