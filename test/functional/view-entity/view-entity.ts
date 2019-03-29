import "reflect-metadata";
import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe.only("view entity", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    // beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create entity view", () => Promise.all(connections.map(async connection => {
        await connection.synchronize();
    })));
});
