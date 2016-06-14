import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {
    setupTestingConnections,
    closeConnections,
    reloadDatabases,
    createTestingConnectionOptions
} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {QueryBuilder} from "../../../src/query-builder/QueryBuilder";
import {Category} from "./entity/Category";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("lazy-relations", () => {
    const resourceDir = __dirname + "/../../../../../test/functional/lazy-relations/";
    const userSchema = require(resourceDir + "schema/user.json");
    const profileSchema = require(resourceDir + "schema/profile.json");

    let connections: Connection[];
    before(() => setupTestingConnections({ entities: [Post, Category], entitySchemas: [userSchema, profileSchema] }).then(all => connections = all));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    it("should persist and hydrate successfully on a relation without inverse side", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);

        const savedCategory1 = new Category();
        savedCategory1.name = "kids";
        const savedCategory2 = new Category();
        savedCategory2.name = "people";
        const savedCategory3 = new Category();
        savedCategory3.name = "animals";

        await categoryRepository.persistMany(savedCategory1, savedCategory2, savedCategory3);

        const savedPost = new Post();
        savedPost.title = "Hello post";
        savedPost.text = "This is post about post";
        savedPost.categories = Promise.resolve([
            savedCategory1, savedCategory2, savedCategory3
        ]);

        await postRepository.persist(savedPost);

        savedPost.categories.should.eventually.be.eql([savedCategory1, savedCategory2, savedCategory3]);

        const post = await postRepository.findOneById(1);
        post.title.should.be.equal("Hello post");
        post.text.should.be.equal("This is post about post");

        post.categories.should.be.instanceOf(Promise);

        const categories = await post.categories;
        categories.length.should.be.equal(3);
        categories.should.contain({ id: 3, name: "kids" });
        categories.should.contain({ id: 1, name: "people" });
        categories.should.contain({ id: 2, name: "animals" });
    })));

    it("should persist and hydrate successfully on a relation with inverse side", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);

        const savedCategory1 = new Category();
        savedCategory1.name = "kids";
        const savedCategory2 = new Category();
        savedCategory2.name = "people";
        const savedCategory3 = new Category();
        savedCategory3.name = "animals";

        await categoryRepository.persistMany(savedCategory1, savedCategory2, savedCategory3);

        const savedPost = new Post();
        savedPost.title = "Hello post";
        savedPost.text = "This is post about post";
        savedPost.twoSideCategories = Promise.resolve([
            savedCategory1, savedCategory2, savedCategory3
        ]);

        await postRepository.persist(savedPost);

        savedPost.twoSideCategories.should.eventually.be.eql([savedCategory1, savedCategory2, savedCategory3]);

        const post = await postRepository.findOneById(1);
        post.title.should.be.equal("Hello post");
        post.text.should.be.equal("This is post about post");

        post.twoSideCategories.should.be.instanceOf(Promise);

        const categories = await post.twoSideCategories;
        categories.length.should.be.equal(3);
        categories.should.contain({ id: 3, name: "kids" });
        categories.should.contain({ id: 1, name: "people" });
        categories.should.contain({ id: 2, name: "animals" });

        const category = await categoryRepository.findOneById(1);
        category.name.should.be.equal("people");
        
        const twoSidePosts = await category.twoSidePosts;
        twoSidePosts.should.contain({ id: 1, title: "Hello post", text: "This is post about post", viewCount: 0 });
    })));

    it("should persist and hydrate successfully on a one-to-one relation with inverse side loaded from entity schema", () => Promise.all(connections.map(async connection => {
        const userRepository = connection.getRepository("User");
        const profileRepository = connection.getRepository("Profile");

        const profile: any = {
            country: "Japan"
        };
        await profileRepository.persist(profile);

        const user: any = {
            firstName: "Umed",
            secondName: "San",
            profile: Promise.resolve(profile)
        };
        await userRepository.persist(user);

        user.profile.should.eventually.be.eql(profile);

        /*const post = await userRepository.findOneById(1);
        post.title.should.be.equal("Hello post");
        post.text.should.be.equal("This is post about post");

        post.twoSideCategories.should.be.instanceOf(Promise);

        const categories = await post.twoSideCategories;
        categories.length.should.be.equal(3);
        categories.should.contain({ id: 3, name: "kids" });
        categories.should.contain({ id: 1, name: "people" });
        categories.should.contain({ id: 2, name: "animals" });

        const category = await categoryRepository.findOneById(1);
        category.name.should.be.equal("people");
        
        const twoSidePosts = await category.twoSidePosts;
        twoSidePosts.should.contain({ id: 1, title: "Hello post", text: "This is post about post", viewCount: 0 });*/
    })));

});