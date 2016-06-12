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
import {FindOptions} from "../../../../src/repository/FindOptions";
import {User} from "./model/User";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("Repository > find methods", () => {
    const resourceDir = __dirname + "/../../../../../../test/functional/repository/find-methods/";
    const userSchema = require(resourceDir + "schema/user.json");
    
    let connections: Connection[];
    before(() => setupTestingConnections({ entities: [Post], entitySchemas: [userSchema] }).then(all => connections = all));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    describe("find and findAndCount", function() {

        it("should return everything when no criteria given", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const promises: Promise<Post>[] = [];
            for (let i = 0; i < 100; i++) {
                const post = new Post();
                post.id = i;
                post.title = "post #" + i;
                post.categoryName = "other";
                promises.push(postRepository.persist(post));
            }

            const savedPosts = await Promise.all(promises);
            savedPosts.length.should.be.equal(100); // check if they all are saved

            // check find method
            const loadedPosts = await postRepository.find();
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(100);
            loadedPosts[0].id.should.be.equal(0);
            loadedPosts[0].title.should.be.equal("post #0");
            loadedPosts[99].id.should.be.equal(99);
            loadedPosts[99].title.should.be.equal("post #99");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount();
            count.should.be.equal(100);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(100);
            loadedPosts2[0].id.should.be.equal(0);
            loadedPosts2[0].title.should.be.equal("post #0");
            loadedPosts2[99].id.should.be.equal(99);
            loadedPosts2[99].title.should.be.equal("post #99");
        })));

        it("should return posts that match given criteria", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const promises: Promise<Post>[] = [];
            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.title = "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                promises.push(postRepository.persist(post));
            }

            const savedPosts = await Promise.all(promises);
            savedPosts.length.should.be.equal(100); // check if they all are saved

            // check find method
            const loadedPosts = await postRepository.find({ categoryName: "odd" });
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(50);
            loadedPosts[0].id.should.be.equal(1);
            loadedPosts[0].title.should.be.equal("post #1");
            loadedPosts[49].id.should.be.equal(99);
            loadedPosts[49].title.should.be.equal("post #99");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount({ categoryName: "odd" });
            count.should.be.equal(50);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(50);
            loadedPosts2[0].id.should.be.equal(1);
            loadedPosts2[0].title.should.be.equal("post #1");
            loadedPosts2[49].id.should.be.equal(99);
            loadedPosts2[49].title.should.be.equal("post #99");
        })));

        it("should return posts that match given multiple criteria", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const promises: Promise<Post>[] = [];
            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.title = "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                post.isNew = i > 90;
                promises.push(postRepository.persist(post));
            }

            const savedPosts = await Promise.all(promises);
            savedPosts.length.should.be.equal(100); // check if they all are saved

            // check find method
            const loadedPosts = await postRepository.find({ categoryName: "odd", isNew: true });
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(5);
            loadedPosts[0].id.should.be.equal(91);
            loadedPosts[0].title.should.be.equal("post #91");
            loadedPosts[4].id.should.be.equal(99);
            loadedPosts[4].title.should.be.equal("post #99");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount({ categoryName: "odd", isNew: true });
            count.should.be.equal(5);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(5);
            loadedPosts2[0].id.should.be.equal(91);
            loadedPosts2[0].title.should.be.equal("post #91");
            loadedPosts2[4].id.should.be.equal(99);
            loadedPosts2[4].title.should.be.equal("post #99");
        })));

        it("should return posts that match given find options", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const promises: Promise<Post>[] = [];
            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.isNew = i > 90;
                post.title = post.isNew ? "new post #" + i : "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                promises.push(postRepository.persist(post));
            }

            const savedPosts = await Promise.all(promises);
            savedPosts.length.should.be.equal(100); // check if they all are saved

            const findOptions: FindOptions = {
                alias: "post",
                where: "post.title LIKE :likeTitle AND post.categoryName = :categoryName",
                parameters: {
                    likeTitle: "new post #%",
                    categoryName: "even"
                }
            };

            // check find method
            const loadedPosts = await postRepository.find(findOptions);
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(5);
            loadedPosts[0].id.should.be.equal(92);
            loadedPosts[0].title.should.be.equal("new post #92");
            loadedPosts[4].id.should.be.equal(100);
            loadedPosts[4].title.should.be.equal("new post #100");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount(findOptions);
            count.should.be.equal(5);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(5);
            loadedPosts2[0].id.should.be.equal(92);
            loadedPosts2[0].title.should.be.equal("new post #92");
            loadedPosts2[4].id.should.be.equal(100);
            loadedPosts2[4].title.should.be.equal("new post #100");
        })));

        it("should return posts that match both criteria and find options", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const promises: Promise<Post>[] = [];
            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.isNew = i > 90;
                post.title = post.isNew ? "new post #" + i : "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                promises.push(postRepository.persist(post));
            }

            const savedPosts = await Promise.all(promises);
            savedPosts.length.should.be.equal(100); // check if they all are saved

            const findOptions: FindOptions = {
                alias: "post",
                firstResult: 1,
                maxResults: 2
            };

            // check find method
            const loadedPosts = await postRepository.find({ categoryName: "even", isNew: true }, findOptions);
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(2);
            loadedPosts[0].id.should.be.equal(94);
            loadedPosts[0].title.should.be.equal("new post #94");
            loadedPosts[1].id.should.be.equal(96);
            loadedPosts[1].title.should.be.equal("new post #96");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount({ categoryName: "even", isNew: true }, findOptions);
            count.should.be.equal(5);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(2);
            loadedPosts2[0].id.should.be.equal(94);
            loadedPosts2[0].title.should.be.equal("new post #94");
            loadedPosts2[1].id.should.be.equal(96);
            loadedPosts2[1].title.should.be.equal("new post #96");
        })));

    });

    describe("findOne", function() {

        it("should return first when no criteria given", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const promises: Promise<User>[] = [];
            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                promises.push(userRepository.persist(user));
            }

            const savedUsers = await Promise.all(promises);
            savedUsers.length.should.be.equal(100); // check if they all are saved

            const loadedUser = await userRepository.findOne();
            loadedUser.id.should.be.equal(0);
            loadedUser.firstName.should.be.equal("name #0");
            loadedUser.secondName.should.be.equal("Doe");
        })));

        it("should return when criteria given", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const promises: Promise<User>[] = [];
            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                promises.push(userRepository.persist(user));
            }

            const savedUsers = await Promise.all(promises);
            savedUsers.length.should.be.equal(100); // check if they all are saved

            const loadedUser = await userRepository.findOne({ firstName: "name #1" });
            loadedUser.id.should.be.equal(1);
            loadedUser.firstName.should.be.equal("name #1");
            loadedUser.secondName.should.be.equal("Doe");
        })));

        it("should return when find options given", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const promises: Promise<User>[] = [];
            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                promises.push(userRepository.persist(user));
            }

            const savedUsers = await Promise.all(promises);
            savedUsers.length.should.be.equal(100); // check if they all are saved

            const findOptions: FindOptions = {
                alias: "user",
                where: "user.firstName=:firstName AND user.secondName =:secondName",
                parameters: {
                    firstName: "name #99",
                    secondName: "Doe"
                }
            };
            const loadedUser = await userRepository.findOne(findOptions);
            loadedUser.id.should.be.equal(99);
            loadedUser.firstName.should.be.equal("name #99");
            loadedUser.secondName.should.be.equal("Doe");
        })));

    });

    describe("findOneById", function() {

        it("should return entity by a given id", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const promises: Promise<User>[] = [];
            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                promises.push(userRepository.persist(user));
            }

            const savedUsers = await Promise.all(promises);
            savedUsers.length.should.be.equal(100); // check if they all are saved

            let loadedUser = await userRepository.findOneById(0);
            loadedUser.id.should.be.equal(0);
            loadedUser.firstName.should.be.equal("name #0");
            loadedUser.secondName.should.be.equal("Doe");

            loadedUser = await userRepository.findOneById(1);
            loadedUser.id.should.be.equal(1);
            loadedUser.firstName.should.be.equal("name #1");
            loadedUser.secondName.should.be.equal("Doe");

            loadedUser = await userRepository.findOneById(99);
            loadedUser.id.should.be.equal(99);
            loadedUser.firstName.should.be.equal("name #99");
            loadedUser.secondName.should.be.equal("Doe");
        })));

        it("should return entity by a given id and find options", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const promises: Promise<User>[] = [];
            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                promises.push(userRepository.persist(user));
            }

            const findOptions1: FindOptions = {
                alias: "user",
                whereConditions: {
                    secondName: "Doe"
                }
            };

            const findOptions2: FindOptions = {
                alias: "user",
                whereConditions: {
                    secondName: "Dorian"
                }
            };

            const savedUsers = await Promise.all(promises);
            savedUsers.length.should.be.equal(100); // check if they all are saved

            let loadedUser = await userRepository.findOneById(0, findOptions1);
            loadedUser.id.should.be.equal(0);
            loadedUser.firstName.should.be.equal("name #0");
            loadedUser.secondName.should.be.equal("Doe");

            loadedUser = await userRepository.findOneById(1, findOptions2);
            expect(loadedUser).to.be.undefined;
        })));

    });

});