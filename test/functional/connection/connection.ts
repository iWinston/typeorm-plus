import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {setupTestingConnections, closeConnections, reloadDatabases, createTestingConnectionOptions} from "../../utils/utils";
import {Connection} from "../../../src/connection/Connection";
import {CannotConnectAlreadyConnectedError} from "../../../src/connection/error/CannotConnectAlreadyConnectedError";
import {CannotCloseNotConnectedError} from "../../../src/connection/error/CannotCloseNotConnectedError";
import {CannotImportAlreadyConnectedError} from "../../../src/connection/error/CannotImportAlreadyConnectedError";
import {Repository} from "../../../src/repository/Repository";
import {TreeRepository} from "../../../src/repository/TreeRepository";
import {ReactiveRepository} from "../../../src/repository/ReactiveRepository";
import {ReactiveTreeRepository} from "../../../src/repository/ReactiveTreeRepository";
import {getConnectionManager} from "../../../src/index";
import {CreateConnectionOptions} from "../../../src/connection-manager/CreateConnectionOptions";
import {CannotSyncNotConnectedError} from "../../../src/connection/error/CannotSyncNotConnectedError";
import {NoConnectionForRepositoryError} from "../../../src/connection/error/NoConnectionForRepositoryError";
import {RepositoryNotFoundError} from "../../../src/connection/error/RepositoryNotFoundError";
import {FirstCustomNamingStrategy} from "./naming-strategy/FirstCustomNamingStrategy";
import {SecondCustomNamingStrategy} from "./naming-strategy/SecondCustomNamingStrategy";
import {CannotUseNamingStrategyNotConnectedError} from "../../../src/connection/error/CannotUseNamingStrategyNotConnectedError";
import {NamingStrategyNotFoundError} from "../../../src/connection/error/NamingStrategyNotFoundError";

chai.should();
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

describe("Connection", () => {

    describe("before connection is established", function() {

        let connection: Connection;
        before(async () => {
            const options: CreateConnectionOptions = {
                driver: "mysql",
                connection: createTestingConnectionOptions("mysql"),
                entities: []
            };
            connection = await getConnectionManager().create(options);
        });
        after(() => {
            if (connection.isConnected)
                return connection.close();
            
            return Promise.resolve();
        });

        it("connection.isConnected should be false", () => {
            connection.isConnected.should.be.false;
        });

        it("import entities, entity schemas, subscribers and naming strategies should work", () => {
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
        });

        it("should not be able to close", () => {
            return connection.close().should.be.rejectedWith(CannotCloseNotConnectedError);
        });

        it("should not be able to sync a schema", () => {
            return connection.syncSchema().should.be.rejectedWith(CannotSyncNotConnectedError);
        });

        it("should not be able to use repositories", () => {
            expect(() => connection.getRepository(Post)).to.throw(NoConnectionForRepositoryError);
            expect(() => connection.getTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
            expect(() => connection.getReactiveRepository(Post)).to.throw(NoConnectionForRepositoryError);
            expect(() => connection.getReactiveTreeRepository(Category)).to.throw(NoConnectionForRepositoryError);
        });

        it("should be able to connect", () => {
            return connection.connect().should.be.fulfilled;
        });

    });

    describe("after connection is established successfully", function() {

        let connections: Connection[];
        before(() => setupTestingConnections({ entities: [Post, Category] }).then(all => connections = all));
        beforeEach(() => reloadDatabases(connections));

        it("connection.isConnected should be true", () => connections.forEach(connection => {
            connection.isConnected.should.be.true;
        }));

        it("import entities, entity schemas, subscribers and naming strategies should not be possible once connection is done", () => connections.forEach(connection => {
            return Promise.all([
                connection.importEntities([Post]).should.be.rejectedWith(CannotImportAlreadyConnectedError),
                connection.importEntitySchemas([]).should.be.rejectedWith(CannotImportAlreadyConnectedError),
                connection.importSubscribers([]).should.be.rejectedWith(CannotImportAlreadyConnectedError),
                connection.importNamingStrategies([]).should.be.rejectedWith(CannotImportAlreadyConnectedError),
                connection.importEntitiesFromDirectories([]).should.be.rejectedWith(CannotImportAlreadyConnectedError),
                connection.importEntitySchemaFromDirectories([]).should.be.rejectedWith(CannotImportAlreadyConnectedError),
                connection.importSubscribersFromDirectories([]).should.be.rejectedWith(CannotImportAlreadyConnectedError),
                connection.importNamingStrategiesFromDirectories([]).should.be.rejectedWith(CannotImportAlreadyConnectedError)
            ]);
        }));

        it("should not be able to connect again", () => connections.forEach(connection => {
            return connection.connect().should.be.rejectedWith(CannotConnectAlreadyConnectedError);
        }));

        it("should not be able to change used naming strategy", () => connections.forEach(connection => {
            expect(() => connection.useNamingStrategy("something")).to.throw(CannotUseNamingStrategyNotConnectedError);
        }));

        it("should be able to close a connection", () => connections.forEach(connection => {
            return connection.close().should.be.fulfilled;
        }));

    });

    describe("working with repositories after connection is established successfully", function() {

        let connections: Connection[];
        before(() => setupTestingConnections({ entities: [Post, Category] }).then(all => connections = all));
        after(() => closeConnections(connections));
        beforeEach(() => reloadDatabases(connections));

        it("should be able to get simple entity repository", () => connections.forEach(connection => {
            connection.getRepository(Post).should.be.instanceOf(Repository);
            connection.getRepository(Post).should.not.be.instanceOf(TreeRepository);
            connection.getRepository(Post).target.should.be.eql(Post);
        }));

        it("should be able to get tree entity repository", () => connections.forEach(connection => {
            connection.getTreeRepository(Category).should.be.instanceOf(TreeRepository);
            connection.getTreeRepository(Category).target.should.be.eql(Category);
        }));

        it("should be able to get simple entity reactive repository", () => connections.forEach(connection => {
            connection.getReactiveRepository(Post).should.be.instanceOf(ReactiveRepository);
            connection.getReactiveRepository(Post).should.not.be.instanceOf(ReactiveTreeRepository);
            connection.getReactiveRepository(Post).target.should.be.eql(Post);
        }));

        it("should be able to get tree entity reactive repository", () => connections.forEach(connection => {
            connection.getReactiveTreeRepository(Category).should.be.instanceOf(ReactiveTreeRepository);
            connection.getReactiveTreeRepository(Category).target.should.be.eql(Category);
        }));

    });

    describe("generate a schema when connection.syncSchema is called", function() {

        let connections: Connection[];
        before(() => setupTestingConnections({ entities: [Post] }).then(all => connections = all));
        after(() => closeConnections(connections));

        it("database should be empty after schema is synced with dropDatabase flag", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const post = new Post();
            post.title = "new post";
            await postRepository.persist(post);
            const loadedPost = await postRepository.findOneById(post.id);
            expect(loadedPost).to.be.eql(post);
            await connection.syncSchema(true);
            const againLoadedPost = postRepository.findOneById(post.id);
            expect(againLoadedPost).to.be.empty;
        })));

    });

    describe("after connection is closed successfully", function() {

        // open a close connections
        let connections: Connection[] = [];
        before(() => setupTestingConnections({ entities: [Post] }).then(all => {
            connections = all;
            return Promise.all(connections.map(connection => connection.close()));
        }));
        
        it("should not be able to close already closed connection", () => connections.forEach(connection => {
            return connection.close().should.be.rejectedWith(CannotCloseNotConnectedError);
        }));

        it("connection.isConnected should be false", () => connections.forEach(connection => {
            connection.isConnected.should.be.false;
        }));

    });

    describe("import entities and entity schemas", function() {

        let firstConnection: Connection, secondConnection: Connection;
        beforeEach(async () => {
            firstConnection = await getConnectionManager().create({
                driver: "mysql",
                connection: createTestingConnectionOptions("mysql")
            });
            secondConnection = await getConnectionManager().create({
                driver: "mysql",
                connection: createTestingConnectionOptions("mysql")
            });
        });

        it("should import first connection's entities only", async () => {
            firstConnection.importEntities([Post]);
            await firstConnection.connect();
            firstConnection.getRepository(Post).should.be.instanceOf(Repository);
            firstConnection.getRepository(Post).target.should.be.equal(Post);
            expect(() => firstConnection.getRepository(Category)).to.throw(RepositoryNotFoundError);
            firstConnection.close();
        });

        it("should import second connection's entities only", async () => {
            secondConnection.importEntities([Category]);
            await secondConnection.connect();
            secondConnection.getRepository(Category).should.be.instanceOf(Repository);
            secondConnection.getRepository(Category).target.should.be.equal(Category);
            expect(() => secondConnection.getRepository(Post)).to.throw(RepositoryNotFoundError);
            secondConnection.close();
        });

        it("should import first connection's entity schemas only", async () => {
            let schemaFile = require("path").normalize(__dirname + "/../../../../../test/functional/connection/schema/user.json");
            firstConnection.importEntitySchemas([ require(schemaFile) ]);
            await firstConnection.connect();
            firstConnection.getRepository("User").should.be.instanceOf(Repository);
            firstConnection.getRepository("User").target.should.be.equal("User");
            expect(() => firstConnection.getRepository("Photo")).to.throw(RepositoryNotFoundError);
            firstConnection.close();
        });

        it("should import second connection's entity schemas only", async () => {
            let schemaFile = require("path").normalize(__dirname + "/../../../../../test/functional/connection/schema/photo.json");
            secondConnection.importEntitySchemas([ require(schemaFile) ]);
            await secondConnection.connect();
            secondConnection.getRepository("Photo").should.be.instanceOf(Repository);
            secondConnection.getRepository("Photo").target.should.be.equal("Photo");
            expect(() => secondConnection.getRepository("User")).to.throw(RepositoryNotFoundError);
            secondConnection.close();
        });

    });

    describe("import entities / entity schemas / subscribers / naming strategies from directories", function() {

        let connection: Connection;
        beforeEach(async () => {
            connection = await getConnectionManager().create({
                driver: "mysql",
                connection: createTestingConnectionOptions("mysql")
            });
        });
        afterEach(() => connection.isConnected ? connection.close() : {});

        it("should import first connection's entities only", async () => {
            // const baseDir = __dirname;
            let clsBaseDir = __dirname; // require("path").normalize(__dirname + "/../../../../../test/functional/connection");
            let jsonBaseDir = require("path").normalize(__dirname + "/../../../../../test/functional/connection");
            connection.importEntitiesFromDirectories([clsBaseDir + "/entity"]);
            connection.importEntitySchemaFromDirectories([jsonBaseDir + "/schema"]);
            connection.importNamingStrategiesFromDirectories([clsBaseDir + "/naming-strategy"]);
            connection.importSubscribersFromDirectories([clsBaseDir + "/subscriber"]);
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
    });

    describe("using naming strategy", function() {

        let connection: Connection;
        beforeEach(async () => {
            connection = await getConnectionManager().create({
                driver: "mysql",
                connection: createTestingConnectionOptions("mysql")
            });
        });
        afterEach(() => connection.isConnected ? connection.close() : {});

        it("should use naming strategy when its class passed to useNamingStrategy method", async () => {
            connection.importEntities([Post]);
            connection.importNamingStrategies([FirstCustomNamingStrategy]);
            connection.useNamingStrategy(FirstCustomNamingStrategy);
            await connection.connect();
            connection.getMetadata(Post).table.name.should.be.equal("POST");
        });

        it("should use naming strategy when its name passed to useNamingStrategy method", async () => {
            connection.importEntities([Category]);
            connection.importNamingStrategies([SecondCustomNamingStrategy]);
            connection.useNamingStrategy("secondCustomNamingStrategy");
            await connection.connect();
            connection.getMetadata(Category).table.name.should.be.equal("category");
        });

        it("should throw an error if not registered naming strategy was used (assert by name)", () => {
            connection.importEntities([Category]);
            connection.importNamingStrategies([FirstCustomNamingStrategy]);
            connection.useNamingStrategy("secondCustomNamingStrategy");
            return connection.connect().should.be.rejectedWith(NamingStrategyNotFoundError);
        });

        it("should throw an error if not registered naming strategy was used (assert by Function)", () => {
            connection.importEntities([Category]);
            connection.importNamingStrategies([SecondCustomNamingStrategy]);
            connection.useNamingStrategy(FirstCustomNamingStrategy);
            return connection.connect().should.be.rejectedWith(NamingStrategyNotFoundError);
        });

    });
    
});