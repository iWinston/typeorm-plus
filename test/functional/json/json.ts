import "reflect-metadata";
import { expect } from "chai";
import { Record } from "./entity/Record";
import { Connection } from "../../../src/connection/Connection";
import { createTestingConnections, reloadTestingDatabases, closeTestingConnections } from "../../utils/test-utils";
import { DataTypeNotSupportedByDriverError } from "../../../src/driver/error/DataTypeNotSupportedByDriverError";
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver";

describe("json type", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Record],
    }));
    // beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should deal with Postgres' jsonb type correctly", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            await connection.syncSchema(true);
            const queryRunner = await connection.driver.createQueryRunner();
            let schema = await queryRunner.loadTableSchema("record");
            expect(schema).to.be.not.null;
            schema = schema!;
            expect(schema.columns.find(columnSchema => columnSchema.name === "config" && columnSchema.type === "json")).to.be.not.undefined;
            expect(schema.columns.find(columnSchema => columnSchema.name === "data" && columnSchema.type === "jsonb")).to.be.not.undefined;
        } else {
            expect(connection.syncSchema(true)).to.eventually.throw(DataTypeNotSupportedByDriverError);
        }
    })));

});