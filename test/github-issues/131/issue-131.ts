import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Employee } from "./entity/Employee";
import { expect } from "chai";

// unskip once table inheritance is back
describe.skip("github issues > #131 Error with single table inheritance query without additional conditions", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,        
    }));
    after(() => closeTestingConnections(connections));

    it("should not fail when querying for single table inheritance model without additional conditions", () => Promise.all(connections.map(async connection => {
        const employees = await connection.getRepository(Employee).find();
        expect(employees).not.to.be.undefined;
    })));

});
