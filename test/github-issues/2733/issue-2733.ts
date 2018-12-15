import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";

describe("github issues > #2733 SqlServer should correctly handle function calls as default values", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["mssql"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not change already synchronized entities", () => Promise.all(connections.map(async connection => {

        const schemaBuilder = connection.driver.createSchemaBuilder();
        const syncQueries = await schemaBuilder.log();

        expect(syncQueries.downQueries).to.be.empty;
        expect(syncQueries.upQueries).to.be.empty;
    })));

});
