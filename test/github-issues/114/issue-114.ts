import "reflect-metadata";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";

describe("github issues > #114 Can not be parsed correctly the URL of pg.", () => {

    let driver: PostgresDriver, connection: Connection;
    before(() => {
        connection = new Connection({
            type: "postgres",
            url: "postgres://test:test@localhost:5432/test",
        });
        driver = new PostgresDriver(connection);
    });

    it("should not fail in url parser", () => {
        expect(connection.options.username).to.be.eq("test");
        expect(connection.options.password).to.be.eq("test");
        expect(connection.options.host).to.be.eq("localhost");
        expect(connection.options.port).to.be.eq(5432);
        expect(connection.options.database).to.be.eq("test");
    });

});
