import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Project } from "./entity/Project";
import { User } from "./entity/User";
import { expect } from "chai";

describe("github issues > #108 Error with constraint names on postgres", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
        enabledDrivers: ["postgres", "mssql"] // TODO:Add tests for mssql
    }));
    after(() => closeTestingConnections(connections));

    it("should sync and create column names in the form uk_{tableName}_{columnName}", () => Promise.all(connections.map(async connection => {
        await connection.syncSchema(true);
        for (const entityType of [User, Project]) {
            const metaData = connection.getMetadata(entityType);
            const [nameCol] = metaData.columns.filter(cm => cm.name === "name");
            expect(nameCol).not.undefined;
            expect(nameCol.isUnique).to.be.true;
        }
    })));

});