import "reflect-metadata";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {Guest as GuestV1} from "./entity/v1/Guest";
import {Comment as CommentV1} from "./entity/v1/Comment";
import {Guest as GuestV2} from "./entity/v2/Guest";
import {Comment as CommentV2} from "./entity/v2/Comment";
import {View} from "./entity/View";
import {Category} from "./entity/Category";
import {closeTestingConnections, createTestingConnections, setupSingleTestingConnection} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {Repository} from "../../../src/repository/Repository";
import {TreeRepository} from "../../../src/repository/TreeRepository";
import {getConnectionManager} from "../../../src/index";
import {NoConnectionForRepositoryError} from "../../../src/connection/error/NoConnectionForRepositoryError";
import {FirstCustomNamingStrategy} from "./naming-strategy/FirstCustomNamingStrategy";
import {SecondCustomNamingStrategy} from "./naming-strategy/SecondCustomNamingStrategy";
import {EntityManager} from "../../../src/entity-manager/EntityManager";
import {CannotGetEntityManagerNotConnectedError} from "../../../src/connection/error/CannotGetEntityManagerNotConnectedError";
import {Blog} from "./modules/blog/entity/Blog";
import {Question} from "./modules/question/entity/Question";
import {Video} from "./modules/video/entity/Video";
import {ConnectionOptions} from "../../../src/connection/ConnectionOptions";
import {DefaultNamingStrategy} from "../../../src/naming-strategy/DefaultNamingStrategy";

describe("Connection", () => {
    const resourceDir = __dirname + "/../../../../../test/functional/connection/";

    describe("before connection is established", function() {

        let connection: Connection;
        before(async () => {
            connection = getConnectionManager().create(setupSingleTestingConnection("mysql", {
                name: "default",
                entities: []
            }));
        });
        after(() => {
            if (connection.isConnected)
                return connection.close();

            return Promise.resolve();
        });

        it("connection.isConnected should be false", () => {
            connection.isConnected.should.be.false;
        });

        it.skip("entity manager and reactive entity manager should not be accessible", () => {
            expect(() => connection.manager).to.throw(CannotGetEntityManagerNotConnectedError);
            // expect(() => connection.reactiveEntityManager).to.throw(CannotGetEntityManagerNotConnectedError);
        });

        // todo: they aren't promises anymore
        /*it("import entities, entity schemas, subscribers and naming strategies should work", () => {
         return Promise.all([
         connection.importEntities([Post]).should.be.fulfilled,
         connection.importEntitySchemas([]).should.be.fulfilled,
         connection.importSubscribers([]).should.be.fulfilled,
         connection.importNamingStrategies([]).should.be.fulfilled,
         connection.importEntitiesFromDirectories([]).should.be.fulfilled,
         connection.importEntitySchemaFromDirectories([]).should.be.fulfilled,
         connection.importSubscribersFromDirectories([]).should.be.fulfilled,
         connection.importNamingStrategiesFromDirectories([]).should.be.fulfilled
         ]);
         });*/

        it("should not be able to close", () => {
            return connection.close().should.be.rejected; // CannotCloseNotConnectedError
        });

        it("should not be able to sync a schema", () => {
            return connection.syncSchema().should.be.rejected; // CannotCloseNotConnectedError
        });

        it.skip("should not be able to use repositories", () => {
            expect(() => connection.getRepository(Post)).to.throw(NoConnectionForRepositoryError);
            expect(() => connection.getTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
            // expect(() => connection.getReactiveRepository(Post)).to.throw(NoConnectionForRepositoryError);
            // expect(() => connection.getReactiveTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
        });

        it("should be able to connect", () => {
            return connection.connect().should.be.fulfilled;
        });

    });

    describe("establishing connection", function() {
        let connection: Connection;
        it("should throw DriverOptionNotSetError when extra.socketPath and host is missing", function() {
            expect(() => {
                connection = getConnectionManager().create(<ConnectionOptions>{
                    driver: {
                        "type": "mysql",
                        "username": "test",
                        "password": "test",
                        "database": "test",
                    },
                    entities: [],
                    entitySchemas: [],
                    dropSchemaOnConnection: false,
                    schemaCreate: false,
                    enabledDrivers: ["mysql"],
                });
            }).to.throw(Error);
        });
    });

    describe("after connection is established successfully", function() {

        let connections: Connection[];
        beforeEach(() => createTestingConnections({ entities: [Post, Category], schemaCreate: true, dropSchemaOnConnection: true }).then(all => connections = all));
        afterEach(() => closeTestingConnections(connections));

        it("connection.isConnected should be true", () => connections.forEach(connection => {
            connection.isConnected.should.be.true;
        }));

        it("entity manager and reactive entity manager should be accessible", () => connections.forEach(connection => {
            expect(connection.manager).to.be.instanceOf(EntityManager);
            // expect(connection.reactiveEntityManager).to.be.instanceOf(ReactiveEntityManager);
        }));

        // todo: they aren't promises anymore
        it("import entities, entity schemas, subscribers and naming strategies should not be possible once connection is done", () => connections.forEach(connection => {
            expect(() => connection.importEntities([Post])).to.throw(Error); // CannotImportAlreadyConnectedError
            expect(() => connection.importEntitySchemas([])).to.throw(Error); // CannotImportAlreadyConnectedError
            expect(() => connection.importSubscribers([])).to.throw(Error); // CannotImportAlreadyConnectedError
            expect(() => connection.importEntitiesFromDirectories([])).to.throw(Error); // CannotImportAlreadyConnectedError
            expect(() => connection.importEntitySchemaFromDirectories([])).to.throw(Error); // CannotImportAlreadyConnectedError
            expect(() => connection.importSubscribersFromDirectories([])).to.throw(Error); // CannotImportAlreadyConnectedError
        }));

        it("should not be able to connect again", () => connections.forEach(connection => {
            return connection.connect().should.be.rejected; // CannotConnectAlreadyConnectedError
        }));

        it("should not be able to change used naming strategy", () => connections.forEach(connection => {
            expect(() => connection.useNamingStrategy(new DefaultNamingStrategy())).to.throw(Error); // CannotUseNamingStrategyNotConnectedError
        }));

        it("should be able to close a connection", async () => Promise.all(connections.map(connection => {
            return connection.close();
        })));

    });

    describe("working with repositories after connection is established successfully", function() {

        let connections: Connection[];
        before(() => createTestingConnections({ entities: [Post, Category], schemaCreate: true, dropSchemaOnConnection: true }).then(all => connections = all));
        after(() => closeTestingConnections(connections));

        it("should be able to get simple entity repository", () => connections.forEach(connection => {
            connection.getRepository(Post).should.be.instanceOf(Repository);
            connection.getRepository(Post).should.not.be.instanceOf(TreeRepository);
            connection.getRepository(Post).target.should.be.eql(Post);
        }));

        it("should be able to get tree entity repository", () => connections.forEach(connection => {
            connection.getTreeRepository(Category).should.be.instanceOf(TreeRepository);
            connection.getTreeRepository(Category).target.should.be.eql(Category);
        }));

        // it("should be able to get simple entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveRepository(Post).should.be.instanceOf(ReactiveRepository);
        //     connection.getReactiveRepository(Post).should.not.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveRepository(Post).target.should.be.eql(Post);
        // }));

        // it("should be able to get tree entity reactive repository", () => connections.forEach(connection => {
        //     connection.getReactiveTreeRepository(Category).should.be.instanceOf(TreeReactiveRepository);
        //     connection.getReactiveTreeRepository(Category).target.should.be.eql(Category);
        // }));

        it("should not be able to get tree entity repository of the non-tree entities", () => connections.forEach(connection => {
            expect(() => connection.getTreeRepository(Post)).to.throw(Error); // RepositoryNotTreeError
            // expect(() => connection.getReactiveTreeRepository(Post)).to.throw(RepositoryNotTreeError);
        }));

        it("should not be able to get repositories that are not registered", () => connections.forEach(connection => {
            expect(() => connection.getRepository("SomeEntity")).to.throw(Error); // RepositoryNotTreeError
            expect(() => connection.getTreeRepository("SomeEntity")).to.throw(Error); // RepositoryNotTreeError
            // expect(() => connection.getReactiveRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
            // expect(() => connection.getReactiveTreeRepository("SomeEntity")).to.throw(RepositoryNotFoundError);
        }));

    });

    describe("generate a schema when connection.syncSchema is called", function() {

        let connections: Connection[];
        before(() => createTestingConnections({ entities: [Post], schemaCreate: true, dropSchemaOnConnection: true }).then(all => connections = all));
        after(() => closeTestingConnections(connections));

        it("database should be empty after schema is synced with dropDatabase flag", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const post = new Post();
            post.title = "new post";
            await postRepository.save(post);
            const loadedPost = await postRepository.findOneById(post.id);
            expect(loadedPost).to.be.eql(post);
            await connection.syncSchema(true);
            const againLoadedPost = await postRepository.findOneById(post.id);
            expect(againLoadedPost).to.be.empty;
        })));

    });

    describe("after connection is closed successfully", function() {

        // open a close connections
        let connections: Connection[] = [];
        before(() => createTestingConnections({ entities: [Post], schemaCreate: true, dropSchemaOnConnection: true }).then(all => {
            connections = all;
            return Promise.all(connections.map(connection => connection.close()));
        }));

        it("should not be able to close already closed connection", () => connections.forEach(connection => {
            return connection.close().should.be.rejected; // CannotCloseNotConnectedError
        }));

        it("connection.isConnected should be false", () => connections.forEach(connection => {
            connection.isConnected.should.be.false;
        }));

    });

    describe("import entities and entity schemas", function() {

        let firstConnection: Connection, secondConnection: Connection;
        beforeEach(async () => {
            firstConnection = getConnectionManager().create(setupSingleTestingConnection("mysql", {
                name: "firstConnection",
                entities: []
            }));
            secondConnection = getConnectionManager().create(setupSingleTestingConnection("mysql", {
                name: "secondConnection",
                entities: []
            }));
        });

        it("should import first connection's entities only", async () => {
            firstConnection.importEntities([Post]);
            await firstConnection.connect();
            firstConnection.getRepository(Post).should.be.instanceOf(Repository);
            firstConnection.getRepository(Post).target.should.be.equal(Post);
            expect(() => firstConnection.getRepository(Category)).to.throw(Error); // RepositoryNotFoundError
            await firstConnection.close();
        });

        it("should import second connection's entities only", async () => {
            secondConnection.importEntities([Category]);
            await secondConnection.connect();
            secondConnection.getRepository(Category).should.be.instanceOf(Repository);
            secondConnection.getRepository(Category).target.should.be.equal(Category);
            expect(() => secondConnection.getRepository(Post)).to.throw(Error); // RepositoryNotFoundError
            await secondConnection.close();
        });

        it("should import first connection's entity schemas only", async () => {
            firstConnection.importEntitySchemas([ require(resourceDir + "schema/user.json") ]);
            await firstConnection.connect();
            firstConnection.getRepository("User").should.be.instanceOf(Repository);
            firstConnection.getRepository("User").target.should.be.equal("User");
            expect(() => firstConnection.getRepository("Photo")).to.throw(Error); // RepositoryNotFoundError
            await firstConnection.close();
        });

        it("should import second connection's entity schemas only", async () => {
            secondConnection.importEntitySchemas([ require(resourceDir + "schema/photo.json") ]);
            await secondConnection.connect();
            secondConnection.getRepository("Photo").should.be.instanceOf(Repository);
            secondConnection.getRepository("Photo").target.should.be.equal("Photo");
            expect(() => secondConnection.getRepository("User")).to.throw(Error); // RepositoryNotFoundError
            await secondConnection.close();
        });

    });

    describe("import entities / entity schemas / subscribers / naming strategies from directories", function() {

        let connection: Connection;
        beforeEach(async () => {
            connection = getConnectionManager().create(setupSingleTestingConnection("mysql", {
                name: "default",
                entities: []
            }));
        });
        afterEach(() => connection.isConnected ? connection.close() : {});

        it("should successfully load entities / entity schemas / subscribers / naming strategies from directories", async () => {
            connection.importEntitiesFromDirectories([__dirname + "/entity/*"]);
            connection.importEntitySchemaFromDirectories([resourceDir + "/schema/*"]);
            connection.importSubscribersFromDirectories([__dirname + "/subscriber/*"]);
            await connection.connect();
            connection.getRepository(Post).should.be.instanceOf(Repository);
            connection.getRepository(Post).target.should.be.equal(Post);
            connection.getRepository(Category).should.be.instanceOf(Repository);
            connection.getRepository(Category).target.should.be.equal(Category);
            connection.getRepository("User").should.be.instanceOf(Repository);
            connection.getRepository("User").target.should.be.equal("User");
            connection.getRepository("Photo").should.be.instanceOf(Repository);
            connection.getRepository("Photo").target.should.be.equal("Photo");
        });

        it("should successfully load entities / entity schemas / subscribers / naming strategies from glob-patterned directories", async () => {
            connection.importEntitiesFromDirectories([__dirname + "/modules/**/entity/*"]);
            connection.importEntitySchemaFromDirectories([resourceDir + "/modules/**/schema/*"]);
            connection.importSubscribersFromDirectories([__dirname + "/modules/**/subscriber/*"]);
            await connection.connect();
            connection.getRepository(Blog).should.be.instanceOf(Repository);
            connection.getRepository(Blog).target.should.be.equal(Blog);
            connection.getRepository(Question).should.be.instanceOf(Repository);
            connection.getRepository(Question).target.should.be.equal(Question);
            connection.getRepository(Video).should.be.instanceOf(Repository);
            connection.getRepository(Video).target.should.be.equal(Video);
            connection.getRepository("BlogCategory").should.be.instanceOf(Repository);
            connection.getRepository("BlogCategory").target.should.be.equal("BlogCategory");
            connection.getRepository("QuestionCategory").should.be.instanceOf(Repository);
            connection.getRepository("QuestionCategory").target.should.be.equal("QuestionCategory");
            connection.getRepository("VideoCategory").should.be.instanceOf(Repository);
            connection.getRepository("VideoCategory").target.should.be.equal("VideoCategory");
        });
    });

    describe("skip schema generation when skipSchemaSync option is used", function() {

        let connections: Connection[];
        beforeEach(() => createTestingConnections({ entities: [View], dropSchemaOnConnection: true }).then(all => connections = all));
        afterEach(() => closeTestingConnections(connections));
        it("database should be empty after schema sync", () => Promise.all(connections.map(async connection => {
            await connection.syncSchema(true);
            const queryRunner = await connection.driver.createQueryRunner();
            let schema = await queryRunner.loadTableSchemas(["view"]);
            expect(schema.some(table => table.name === "view")).to.be.false;
        })));

    });

    describe("different names of the same content of the schema", () => {

        let connections: Connection[];
        beforeEach(async () => {
            const connections1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schemaName: "test-schema",
                dropSchemaOnConnection: true,
            });
            const connections2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schemaName: "another-schema",
                dropSchemaOnConnection: true
            });
            connections = [...connections1, ...connections2];
        });
        after(() => closeTestingConnections(connections));
        it("should not interfere with each other", async () => {
            await Promise.all(connections.map(c => c.syncSchema()));
            await closeTestingConnections(connections);
            const connections1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV2, GuestV2],
                schemaName: "test-schema",
                dropSchemaOnConnection: false,
                schemaCreate: true
            });
            const connections2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV2, GuestV2],
                schemaName: "another-schema",
                dropSchemaOnConnection: false,
                schemaCreate: true
            });
            connections = [...connections1, ...connections2];
        });
    });

    describe("can change postgres default schema name", () => {
        let connections: Connection[];
        beforeEach(async () => {
            const connections1 = await createTestingConnections({
                name: "test",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schemaName: "test-schema",
                dropSchemaOnConnection: true,
            });
            const connections2 = await createTestingConnections({
                name: "another",
                enabledDrivers: ["postgres"],
                entities: [CommentV1, GuestV1],
                schemaName: "another-schema",
                dropSchemaOnConnection: true
            });
            connections = [...connections1, ...connections2];
        });
        afterEach(() => closeTestingConnections(connections));

        it("schema name can be set", () => {
            return Promise.all(connections.map(async connection => {
                await connection.syncSchema(true);
                const schemaName = (connection.driver as PostgresDriver).schemaName;
                const comment = new CommentV1();
                comment.title = "Change SchemaName";
                comment.context = `To ${schemaName}`;

                const commentRepo = connection.getRepository(CommentV1);
                await commentRepo.save(comment);

                const query = await connection.driver.createQueryRunner();
                const rows = await query.query(`select * from "${schemaName}"."comment" where id = $1`, [comment.id]);
                expect(rows[0]["context"]).to.be.eq(comment.context);
            }));

        });

    });

});
