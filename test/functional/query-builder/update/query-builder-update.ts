import "reflect-metadata";
import * as chai from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {expect} from "chai";

const should = chai.should();

describe.only("query builder > update", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform updation correctly", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(user);

        await connection.createQueryBuilder()
            .update(User)
            .set({
                name: "Dima Zotov"
            })
            .where("name = :name", { name: "Alex Messer" })
            .execute();

        const loadedUser1 = await connection.getRepository(User).findOne({ name: "Dima Zotov" });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima Zotov");

        await connection.getRepository(User)
            .createQueryBuilder("myUser")
            .update()
            .set({ name: "Muhammad Mirzoev" })
            .where("myUser.name = :name", { name: "Dima Zotov" })
            .execute();

        const loadedUser2 = await connection.getRepository(User).findOne({ name: "Muhammad Mirzoev" });
        expect(loadedUser2).to.exist;
        loadedUser2!.name.should.be.equal("Muhammad Mirzoev");

    })));

});