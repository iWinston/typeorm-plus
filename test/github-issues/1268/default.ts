import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {User} from "./entity/User";

describe("github issues > #1268 sqlite batch insert with default", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save entities where default value is not specified", () => Promise.all(connections.map(async connection => {

        const repository = connection.getRepository(User);

        let user1 = new User();
        user1.name = "Daniel Lang";

        let user2 = new User();
        user2.name = "Daniel Kurz";
        user2.isAdmin = false;

        let user3 = new User();
        user3.name = "Daniel Lang3";
        user3.isAdmin = true;

        await repository.insert([user1, user2, user3]);

        let adminUsers = await repository.find({isAdmin: true});

        expect(adminUsers.length).to.be.equal(2);
    })));

});
