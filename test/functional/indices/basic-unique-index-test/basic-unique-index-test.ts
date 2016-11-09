import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Customer} from "./entity/Customer";

describe.only("indices > basic unique index test", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    describe("unique index", function() {

        it("should work without errors", () => Promise.all(connections.map(async connection => {
            const customer = new Customer();
            customer.nameEnglish = "Umed";
            customer.nameHebrew = "Uma";
            await connection.entityManager.persist(customer);
        })));

    });

});