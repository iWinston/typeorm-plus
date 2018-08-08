import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { Post } from "./entity/Post";

describe("github issues > #2128 skip preparePersistentValue for value functions", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres", "mysql"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be able to resolve value functions", () => Promise.all(connections.map(async connection => {

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values({
                title: "First Post",
                meta: {
                    keywords: [
                        "important",
                        "fresh"
                    ]
                }
            })
            .execute();


    })));

});
