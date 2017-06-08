import "reflect-metadata";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {Logger} from "../../../src/logger/Logger";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";

describe("github issues > #114 Can not be parsed correctly the URL of pg.", () => {

    let driver: PostgresDriver;
    before(() => driver = new PostgresDriver(new Connection({
      type: "postgres",
      url: "postgres://test:test@localhost:5432/test",
    })));

    it("should not fail in url parser", () => {
        expect(driver.options.username).to.be.eq("test");
        expect(driver.options.password).to.be.eq("test");
        expect(driver.options.host).to.be.eq("localhost");        
        expect(driver.options.port).to.be.eq(5432);
        expect(driver.options.database).to.be.eq("test");        
    });

});
