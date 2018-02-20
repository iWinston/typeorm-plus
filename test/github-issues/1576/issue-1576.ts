import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("github issues > #1576 Entities with null as `id` are merged [@next]", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should successfully create object", () => Promise.all(connections.map(async connection => {

        const cats = [
            { id: null, name2: "1" },
            { id: null, name: "2", name2: null },
        ];

        const post = connection.manager.create(Post, {
            categories: cats
        });

        console.log(post);
    })));

});
