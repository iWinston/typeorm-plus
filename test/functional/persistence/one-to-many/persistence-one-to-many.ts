import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Repository} from "../../../../src/repository/Repository";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {CreateConnectionOptions} from "../../../../src/connection-manager/CreateConnectionOptions";
import {createConnection} from "../../../../src/index";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("persistence > one-to-many", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    const parameters: CreateConnectionOptions = {
        driver: "mysql",
        connection: {
            host: "192.168.99.100",
            port: 3306,
            username: "root",
            password: "admin",
            database: "test",
            autoSchemaCreate: true
        },
        entities: [Post, Category]
    };

    // connect to db
    let connection: Connection;
    before(function() {
        return createConnection(parameters)
            .then(con => connection = con)
            .catch(e => console.log("Error during connection to db: " + e));
    });

    after(function() {
        connection.close();
    });

    // clean up database before each test
    function reloadDatabase() {
        return connection.syncSchema(true)
            .catch(e => console.log("Error during schema re-creation: ", e));
    }

    let postRepository: Repository<Post>;
    let categoryRepository: Repository<Category>;
    before(function() {
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
    });

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------
    
    describe("add exist element to exist object with empty one-to-many relation and save it", function() {
        let newPost: Post, newCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            return categoryRepository.persist(newCategory);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.persist(newPost);
        });

        // add category to post and save it
        before(function() {
            newPost.categories = [newCategory];
            return postRepository.persist(newPost);
        });

        // load a post and join its category
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", innerJoinAndSelect: { categories: "post.categories" } })
                .then(post => loadedPost = post);
        });

        it("should contain a new category", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).not.to.be.empty;
            if (loadedPost.categories) {
                expect(loadedPost.categories[0]).not.to.be.empty;
            }
        });

    });

    describe("add exist element to new object with empty one-to-many relation and save it", function() {
        let newPost: Post, newCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory = categoryRepository.create();
            newCategory.name = "Animals";
            return categoryRepository.persist(newCategory);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            newPost.categories = [newCategory];
            return postRepository.persist(newPost);
        });

        // load a post and join its category
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", innerJoinAndSelect: { categories: "post.categories" } })
                .then(post => loadedPost = post);
        });

        it("should contain a new element", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).not.to.be.empty;
            if (loadedPost.categories) {
                expect(loadedPost.categories[0]).not.to.be.empty;
            }
        });

    });

    describe("remove exist element from one-to-many relation and save it", function() {
        let newPost: Post, firstNewCategory: Category, secondNewCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            firstNewCategory = categoryRepository.create();
            firstNewCategory.name = "Animals";
            return categoryRepository.persist(firstNewCategory);
        });

        // save a second category
        before(function () {
            secondNewCategory = categoryRepository.create();
            secondNewCategory.name = "Insects";
            return categoryRepository.persist(secondNewCategory);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.persist(newPost);
        });

        // add categories to post and save it
        before(function() {
            newPost.categories = [firstNewCategory, secondNewCategory];
            return postRepository.persist(newPost);
        });

        // remove one of the categories and save it
        before(function() {
            newPost.categories = [firstNewCategory];
            return postRepository.persist(newPost);
        });

        // load a post and join its category
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", innerJoinAndSelect: { categories: "post.categories" } })
                .then(post => loadedPost = post);
        });

        it("should have only one category", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).not.to.be.empty;
            if (loadedPost.categories) {
                expect(loadedPost.categories[0]).not.to.be.empty;
                expect(loadedPost.categories[1]).to.be.empty;
            }
        });

    });
    
    describe("remove all elements from one-to-many relation and save it", function() {
        let newPost: Post, firstNewCategory: Category, secondNewCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            firstNewCategory = categoryRepository.create();
            firstNewCategory.name = "Animals";
            return categoryRepository.persist(firstNewCategory);
        });

        // save a second category
        before(function () {
            secondNewCategory = categoryRepository.create();
            secondNewCategory.name = "Insects";
            return categoryRepository.persist(secondNewCategory);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.persist(newPost);
        });

        // add categories to post and save it
        before(function() {
            newPost.categories = [firstNewCategory, secondNewCategory];
            return postRepository.persist(newPost);
        });

        // remove one of the categories and save it
        before(function() {
            newPost.categories = [];
            return postRepository.persist(newPost);
        });

        // load a post and join its category
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", leftJoinAndSelect: { categories: "post.categories" } })
                .then(post => loadedPost = post);
        });

        it("should not have categories since they all are removed", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).to.be.empty;
        });

    });

    describe("set relation to null (elements exist there) from one-to-many relation and save it", function() {
        let newPost: Post, firstNewCategory: Category, secondNewCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(function () {
            firstNewCategory = categoryRepository.create();
            firstNewCategory.name = "Animals";
            return categoryRepository.persist(firstNewCategory);
        });

        // save a second category
        before(function () {
            secondNewCategory = categoryRepository.create();
            secondNewCategory.name = "Insects";
            return categoryRepository.persist(secondNewCategory);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "All about animals";
            return postRepository.persist(newPost);
        });

        // add categories to post and save it
        before(function() {
            newPost.categories = [firstNewCategory, secondNewCategory];
            return postRepository.persist(newPost);
        });

        // remove one of the categories and save it
        before(function() {
            newPost.categories = null; // todo: what to do with undefined?
            return postRepository.persist(newPost);
        });

        // load a post and join its category
        before(function() {
            return postRepository
                .findOneById(1, { alias: "post", leftJoinAndSelect: { categories: "post.categories" } })
                .then(post => loadedPost = post);
        });

        it("should not have categories since they all are removed", function () {
            expect(loadedPost).not.to.be.empty;
            expect(loadedPost.categories).to.be.empty;
        });

    });

});