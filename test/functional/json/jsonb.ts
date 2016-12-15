import "reflect-metadata";
import { expect } from "chai";
import { Record } from "./entity/Record";
import { Connection } from "../../../src/connection/Connection";
import { createTestingConnections, reloadTestingDatabases, closeTestingConnections } from "../../utils/test-utils";
import { DataTypeNotSupportedByDriverError } from "../../../src/driver/error/DataTypeNotSupportedByDriverError";
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver";

describe("jsonb type", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Record],
    }));
    // beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should make correct schema with Postgres' jsonb type", () => Promise.all(connections.map(async connection => {
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

    it("should persist jsonb correctly", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            await connection.syncSchema(true);
            let recordRepo = connection.getRepository(Record);
            let record = new Record();
            record.data = { foo: "bar" };
            let persistedRecord = await recordRepo.persist(record);
            let foundRecord = await recordRepo.findOneById(persistedRecord.id);
            expect(foundRecord).to.be.not.undefined;
            expect(foundRecord!.data.foo).to.eq("bar");
        }
    })));

});