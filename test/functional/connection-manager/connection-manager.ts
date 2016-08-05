import "reflect-metadata";
import {expect} from "chai";
import {createTestingConnectionOptions} from "../../utils/test-utils";
import {ConnectionOptions} from "../../../src/connection/ConnectionOptions";
import {ConnectionManager} from "../../../src/connection/ConnectionManager";
import {MysqlDriver} from "../../../src/driver/MysqlDriver";
import {PostgresDriver} from "../../../src/driver/PostgresDriver";
import {ConnectionNotFoundError} from "../../../src/connection/error/ConnectionNotFoundError";

describe("ConnectionManager", () => {

    describe("create", function() {

        it("should create a mysql connection when mysql driver is specified", () => {
            const options: ConnectionOptions = {
                driver: "mysql",
                driverOptions: createTestingConnectionOptions("mysql")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.driver.should.be.instanceOf(MysqlDriver);
        });

        it("should create a postgres connection when mysql driver is specified", () => {
            const options: ConnectionOptions = {
                driver: "postgres",
                connectionName: "myPostgresConnection",
                driverOptions: createTestingConnectionOptions("postgres")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.name.should.be.equal("myPostgresConnection");
            connection.driver.should.be.instanceOf(PostgresDriver);
        });

    });

    // todo: I think we simply don't need this function
    /*describe("createConnection", function() {

        it("should create a connection with the given connection name and driver", () => {
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.createConnection("newConnection", new MysqlDriver(createTestingConnectionOptions("mysql")));
            connection.name.should.be.equal("newConnection");
            connection.driver.should.be.instanceOf(MysqlDriver);
        });

        it("should replace old connection with the given name if it exist", () => {
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.createConnection("newConnection", new MysqlDriver(createTestingConnectionOptions("mysql")));
            connectionManager.get("newConnection").should.be.equal(connection);
            const againConnection = connectionManager.createConnection("newConnection", new MysqlDriver(createTestingConnectionOptions("mysql")));
            connectionManager.get("newConnection").should.be.equal(againConnection);
        });

    });*/

    describe("get", function() {

        it("should give connection with a requested name", () => {
            const options: ConnectionOptions = {
                driver: "mysql",
                connectionName: "myMysqlConnection",
                driverOptions: createTestingConnectionOptions("mysql")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.driver.should.be.instanceOf(MysqlDriver);
            connectionManager.get("myMysqlConnection").should.be.equal(connection);
        });

        it("should throw an error if connection with the given name was not found", () => {
            const options: ConnectionOptions = {
                driver: "mysql",
                connectionName: "myMysqlConnection",
                driverOptions: createTestingConnectionOptions("mysql")
            };
            const connectionManager = new ConnectionManager();
            const connection = connectionManager.create(options);
            connection.driver.should.be.instanceOf(MysqlDriver);
            expect(() => connectionManager.get("myPostgresConnection")).to.throw(ConnectionNotFoundError);
        });

    });

});