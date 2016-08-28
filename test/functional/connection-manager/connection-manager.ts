import "reflect-metadata";
import {expect} from "chai";
import {createTestingConnectionOptions} from "../../utils/test-utils";
import {ConnectionOptions} from "../../../src/connection/ConnectionOptions";
import {ConnectionManager} from "../../../src/connection/ConnectionManager";
import {MysqlDriver} from "../../../src/driver/MysqlDriver";
import {PostgresqlDriver} from "../../../src/driver/PostgresqlDriver";
import {ConnectionNotFoundError} from "../../../src/connection/error/ConnectionNotFoundError";
import {PrimaryColumn} from "../../../src/decorator/columns/PrimaryColumn";
import {Column} from "../../../src/decorator/columns/Column";
import {Table} from "../../../src/decorator/tables/Table";

describe("ConnectionManager", () => {

    @Table()
    class Post {

        @PrimaryColumn("int", { generated: true })
        id: number;

        @Column()
        title: string;

        constructor(id: number, title: string) {
            this.id = id;
            this.title = title;
        }
    }

    describe("create", function() {

        it("should create a mysql connection when mysql driver is specified", () => {
            const options: ConnectionOptions = {
                driver: createTestingConnectionOptions("mysql")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.name.should.be.equal("default");
            connection.driver.should.be.instanceOf(MysqlDriver);
            connection.isConnected.should.be.false;
        });

        it("should create a postgres connection when postgres driver is specified", () => {
            const options: ConnectionOptions = {
                name: "myPostgresConnection",
                driver: createTestingConnectionOptions("postgres")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.name.should.be.equal("myPostgresConnection");
            connection.driver.should.be.instanceOf(PostgresqlDriver);
            connection.isConnected.should.be.false;
        });

    });

    describe("createAndConnect", function() {

        it("should create a mysql connection when mysql driver is specified AND connect to it", async () => {
            const options: ConnectionOptions = {
                driver: createTestingConnectionOptions("mysql")
            };
            const connectionManager = new ConnectionManager();
            const connection = await connectionManager.createAndConnect(options);
            connection.name.should.be.equal("default");
            connection.driver.should.be.instanceOf(MysqlDriver);
            connection.isConnected.should.be.true;
        });

        it("should create a postgres connection when postgres driver is specified AND connect to it", async () => {
            const options: ConnectionOptions = {
                name: "myPostgresConnection",
                driver: createTestingConnectionOptions("postgres")
            };
            const connectionManager = new ConnectionManager();
            const connection = await connectionManager.createAndConnect(options);
            connection.name.should.be.equal("myPostgresConnection");
            connection.driver.should.be.instanceOf(PostgresqlDriver);
            connection.isConnected.should.be.true;
        });

    });

    describe("get", function() {

        it("should give connection with a requested name", () => {
            const options: ConnectionOptions = {
                name: "myMysqlConnection",
                driver: createTestingConnectionOptions("mysql")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.driver.should.be.instanceOf(MysqlDriver);
            connectionManager.get("myMysqlConnection").should.be.equal(connection);
        });

        it("should throw an error if connection with the given name was not found", () => {
            const options: ConnectionOptions = {
                name: "myMysqlConnection",
                driver: createTestingConnectionOptions("mysql")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.driver.should.be.instanceOf(MysqlDriver);
            expect(() => connectionManager.get("myPostgresConnection")).to.throw(ConnectionNotFoundError);
        });

    });

    describe("create connection options", function() {

        it("should not drop the database if dropSchemaOnConnection was not specified", async () => {
            const options: ConnectionOptions = {
                driver: createTestingConnectionOptions("mysql"),
                autoSchemaCreate: true,
                entities: [Post]
            };
            const connectionManager = new ConnectionManager();

            // create connection, save post and close connection
            let connection = await connectionManager.createAndConnect(options);
            const post = new Post(1, "Hello post");
            await connection.entityManager.persist(post);
            await connection.close();

            // recreate connection and find previously saved post
            connection = await connectionManager.createAndConnect(options);
            const loadedPost = await connection.entityManager.findOneById(Post, 1);
            loadedPost.should.be.instanceof(Post);
            loadedPost.should.be.eql({ id: 1, title: "Hello post" });
        });

        it("should drop the database if dropSchemaOnConnection was set to true (mysql)", async () => {
            const options: ConnectionOptions = {
                dropSchemaOnConnection: true,
                autoSchemaCreate: true,
                driver: createTestingConnectionOptions("mysql"),
                entities: [Post]
            };
            const connectionManager = new ConnectionManager();

            // create connection, save post and close connection
            let connection = await connectionManager.createAndConnect(options);
            const post = new Post(1, "Hello post");
            await connection.entityManager.persist(post);
            await connection.close();

            // recreate connection and find previously saved post
            connection = await connectionManager.createAndConnect(options);
            const loadedPost = await connection.entityManager.findOneById(Post, 1);
            expect(loadedPost).to.be.undefined;
         });

        it("should drop the database if dropSchemaOnConnection was set to true (postgres)", async () => {
            const options: ConnectionOptions = {
                dropSchemaOnConnection: true,
                autoSchemaCreate: true,
                driver: createTestingConnectionOptions("postgres"),
                entities: [Post]
            };
            const connectionManager = new ConnectionManager();

            // create connection, save post and close connection
            let connection = await connectionManager.createAndConnect(options);
            const post = new Post(1, "Hello post");
            await connection.entityManager.persist(post);
            await connection.close();

            // recreate connection and find previously saved post
            connection = await connectionManager.createAndConnect(options);
            const loadedPost = await connection.entityManager.findOneById(Post, 1);
            expect(loadedPost).to.be.undefined;
         });

        it("should drop the database if dropSchemaOnConnection was set to true (postgres)", async () => {
            const options: ConnectionOptions = {
                dropSchemaOnConnection: true,
                autoSchemaCreate: true,
                driver: createTestingConnectionOptions("postgres"),
                entities: [Post]
            };
            const connectionManager = new ConnectionManager();

            // create connection, save post and close connection
            let connection = await connectionManager.createAndConnect(options);
            const post = new Post(1, "Hello post");
            await connection.entityManager.persist(post);
            await connection.close();

            // recreate connection and find previously saved post
            connection = await connectionManager.createAndConnect(options);
            const loadedPost = await connection.entityManager.findOneById(Post, 1);
            expect(loadedPost).to.be.undefined;
         });

    });

});