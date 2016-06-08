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

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("Repository", () => {
    const resourceDir = __dirname + "/../../../../../../test/functional/repository/basic-functionality/";

    const userSchema = require(resourceDir + "schema/user.json");
    
    let connections: Connection[];
    before(() => setupTestingConnections({ entities: [Post], entitySchemas: [userSchema, questionSchema] }).then(all => connections = all));
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

        it("should create a new query builder", () => connections.forEach(connection => {
            const postRepository = connection.getRepository(Post);
            postRepository.createQueryBuilder("post").should.be.instanceOf(QueryBuilder);
            const userRepository = connection.getRepository("User");
            userRepository.createQueryBuilder("user").should.be.instanceOf(QueryBuilder);
            const questionRepository = connection.getRepository("Question");
            questionRepository.createQueryBuilder("question").should.be.instanceOf(QueryBuilder);
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

});