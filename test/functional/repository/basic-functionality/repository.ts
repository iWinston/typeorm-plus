import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {
    setupTestingConnections,
    closeConnections,
    reloadDatabases,
    createTestingConnectionOptions
} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {QueryBuilder} from "../../../../src/query-builder/QueryBuilder";
import {User} from "./model/User";
import questionSchema from "./model-schema/QuestionSchema";
import {Question} from "./model/Question";
import {Blog} from "./entity/Blog";
import {Category} from "./entity/Category";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("Repository", () => {
    const resourceDir = __dirname + "/../../../../../../test/functional/repository/basic-functionality/";

    const userSchema = require(resourceDir + "schema/user.json");
    
    let connections: Connection[];
    before(() => setupTestingConnections({ entities: [Post, Blog, Category], entitySchemas: [userSchema, questionSchema] }).then(all => connections = all));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    describe("target", function() {

        it("should return instance of the object it manages", () => connections.forEach(connection => {
            const postRepository = connection.getRepository(Post);
            postRepository.target.should.be.equal(Post);
            const userRepository = connection.getRepository<User>("User");
            userRepository.target.should.be.equal("User");
            const questionRepository = connection.getRepository<Question>("Question");
            questionRepository.target.should.be.instanceOf(Function);
        }));

    });
    
    describe("hasId", function() {

        it("should return true if entity has an id", () => connections.forEach(connection => {
            const postRepository = connection.getRepository(Post);
            const userRepository = connection.getRepository("User");

            const postWithId = new Post();
            postWithId.id = 1;
            postWithId.title = "Hello post";
            postRepository.hasId(postWithId).should.be.equal(true);

            const postWithZeroId = new Post();
            postWithZeroId.id = 0;
            postWithZeroId.title = "Hello post";
            postRepository.hasId(postWithZeroId).should.be.equal(true);

            const userWithId: User = {
                id: 1,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithId).should.be.equal(true);

            const userWithZeroId: User = {
                id: 1,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithZeroId).should.be.equal(true);

        }));

        it("should return false if entity does not have an id", () => connections.forEach(connection => {
            const postRepository = connection.getRepository(Post);
            const userRepository = connection.getRepository("User");

            postRepository.hasId(null as any).should.be.equal(false);
            postRepository.hasId(undefined as any).should.be.equal(false);

            const postWithoutId = new Post();
            postWithoutId.title = "Hello post";
            postRepository.hasId(postWithoutId).should.be.equal(false);

            const postWithUndefinedId = new Post();
            postWithUndefinedId.id = undefined;
            postWithUndefinedId.title = "Hello post";
            postRepository.hasId(postWithUndefinedId).should.be.equal(false);

            const postWithNullId = new Post();
            postWithNullId.id = null;
            postWithNullId.title = "Hello post";
            postRepository.hasId(postWithNullId).should.be.equal(false);

            const postWithEmptyId = new Post();
            postWithEmptyId.id = "";
            postWithEmptyId.title = "Hello post";
            postRepository.hasId(postWithEmptyId).should.be.equal(false);

            const userWithoutId: User = {
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithoutId).should.be.equal(false);

            const userWithNullId: User = {
                id: null,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithNullId).should.be.equal(false);

            const userWithUndefinedId: User = {
                id: undefined,
                firstName: "Jonh",
                secondName: "Doe"
            };
            userRepository.hasId(userWithUndefinedId).should.be.equal(false);
        }));

    });

    describe("createQueryBuilder", function() {

        it("should create a new query builder with the given alias", () => connections.forEach(connection => {
            const postRepository = connection.getRepository(Post);
            const postQb = postRepository.createQueryBuilder("post");
            postQb.should.be.instanceOf(QueryBuilder);
            postQb.alias.should.be.equal("post");
            const userRepository = connection.getRepository("User");
            const userQb = userRepository.createQueryBuilder("user");
            userQb.should.be.instanceOf(QueryBuilder);
            userQb.alias.should.be.equal("user");
            const questionRepository = connection.getRepository("Question");
            const questionQb = questionRepository.createQueryBuilder("question");
            questionQb.should.be.instanceOf(QueryBuilder);
            questionQb.alias.should.be.equal("question");
        }));

    });

    describe("create", function() {

        it("should create a new instance of the object we are working with", () => connections.forEach(connection => {
            const repository = connection.getRepository(Post);
            repository.create().should.be.instanceOf(Post);
        }));

        it("should create a new empty object if entity schema is used", () => connections.forEach(connection => {
            const repository = connection.getRepository("User");
            repository.create().should.be.eql({});
        }));

        it("should create a new empty object if entity schema with a target is used", () => connections.forEach(connection => {
            const repository = connection.getRepository<Question>("Question");
            repository.create().should.not.be.empty;
            repository.create().type.should.be.equal("question"); // make sure this is our Question function
        }));

        it("should create an entity and copy to it all properties of the given plain object if its given", () => connections.forEach(connection => {
            const postRepository = connection.getRepository(Post);
            const userRepository = connection.getRepository<User>("User");
            const questionRepository = connection.getRepository<Question>("Question");

            const plainPost = { id: 2, title: "Hello post" };
            const post = postRepository.create(plainPost);
            post.should.be.instanceOf(Post);
            (post.id as number).should.be.equal(2);
            post.title.should.be.equal("Hello post");

            const plainUser = { id: 3, firstName: "John", secondName: "Doe" };
            const user = userRepository.create(plainUser);
            (user.id as number).should.be.equal(3);
            (user.firstName as string).should.be.equal("John");
            (user.secondName as string).should.be.equal("Doe");

            const plainQuestion = { id: 3, title: "What is better?" };
            const question = questionRepository.create(plainQuestion);
            (question.id as number).should.be.equal(3);
            (question.title as string).should.be.equal("What is better?");
        }));

    });

    describe("createMany", function() {

        it("should create entities and copy to them all properties of the given plain object if its given", () => connections.forEach(connection => {
            const postRepository = connection.getRepository(Post);
            const plainPosts = [{ id: 2, title: "Hello post" }, { id: 3, title: "Bye post" }];
            const posts = postRepository.createMany(plainPosts);
            posts.length.should.be.equal(2);
            posts[0].should.be.instanceOf(Post);
            (posts[0].id as number).should.be.equal(2);
            posts[0].title.should.be.equal("Hello post");
            posts[1].should.be.instanceOf(Post);
            (posts[1].id as number).should.be.equal(3);
            posts[1].title.should.be.equal("Bye post");
        }));

    });

    describe("initialize", function() {

        it("should initialize full object from the given object with only id", () => Promise.all(connections.map(async connection => {
            const blogRepository = connection.getRepository(Blog);
            const categoryRepository = connection.getRepository(Category);

            // save the category
            const category = new Category();
            category.name = "people";
            await categoryRepository.persist(category);

            // save the blog
            const blog = new Blog();
            blog.title = "About people";
            blog.text = "Blog about good people";
            blog.categories = [category];
            await blogRepository.persist(blog);
            
            // and initialize it
            const plainBlogWithId = { id: 1 };
            const initializedBlog = await blogRepository.initialize(plainBlogWithId);
            initializedBlog.should.be.instanceOf(Blog);
            initializedBlog.id.should.be.equal(1);
            initializedBlog.title.should.be.equal("About people");
            initializedBlog.text.should.be.equal("Blog about good people");
        })));

    });

    describe("initialize and merge", function() {

        it("if we initialize entity from the plain object and merge initialized object with plain object we'll have an object from the db with the replaced properties by a plain object's properties", () => Promise.all(connections.map(async connection => {
            const blogRepository = connection.getRepository(Blog);
            const categoryRepository = connection.getRepository(Category);

            // save the category
            const category = new Category();
            category.name = "people";
            await categoryRepository.persist(category);

            // save the blog
            const blog = new Blog();
            blog.title = "About people";
            blog.text = "Blog about good people";
            blog.categories = [category];
            await blogRepository.persist(blog);

            // and initialize it
            const plainBlogWithId = { id: 1, title: "changed title about people" };
            const initializedBlog = await blogRepository.initialize(plainBlogWithId);
            const mergedBlog = blogRepository.merge(initializedBlog, plainBlogWithId);
            mergedBlog.should.be.instanceOf(Blog);
            mergedBlog.id.should.be.equal(1);
            mergedBlog.title.should.be.equal("changed title about people");
            mergedBlog.text.should.be.equal("Blog about good people");
        })));

    });

});