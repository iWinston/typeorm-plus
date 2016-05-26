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

describe("query builder > relation count", function() {

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
            autoSchemaCreate: true,
            logging: {
                logFailedQueryError: true
            }
        },
        entities: [Post, Category]
    };
    // connect to db
    let connection: Connection;
    before(function() {
        return createConnection(parameters)
            .then(con => connection = con)
            .catch(e => {
                console.log("Error during connection to db: " + e);
                throw e;
            });
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
        let newPost: Post, newCategory1: Category, newCategory2: Category, loadedPosts: Post[];

        before(reloadDatabase);

        // save a new category
        before(function () {
            newCategory1 = categoryRepository.create();
            newCategory1.name = "Animals";
            return categoryRepository.persist(newCategory1);
        });

        // save a new category
        before(function () {
            newCategory2 = categoryRepository.create();
            newCategory2.name = "Kids";
            return categoryRepository.persist(newCategory2);
        });

        // save a new post
        before(function() {
            newPost = postRepository.create();
            newPost.title = "Super post";
            newPost.categories = [newCategory1, newCategory2];
            return postRepository.persist(newPost);
        });

        // load a post, want to have categories count
        before(function() {
            // todo...
        });

        it("should contain a new category", function () {
            // todo...
            // console.log(loadedPosts);
            // expect(loadedPosts).not.to.be.empty;
            // expect(loadedPost.categories).not.to.be.empty;
        });

    });

});