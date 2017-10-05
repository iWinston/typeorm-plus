import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {User} from "./entity/user";

describe("github issues > #1002 @PrimaryGeneratedColumn('uuid')", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create the table and insert a uuid", () => Promise.all(connections.map(async connection => {
        let user = new User();
        user.firstname = "Max";
        user.lastname = "Mustermann";
        const repository = connection.getRepository(User);
        await repository.save(user);
        const savedUser = await repository.findOne({firstname: "Max"});

        expect(savedUser).not.to.be.undefined;
        if (savedUser) {
            expect(savedUser.id).not.be.undefined;
        }
    })));

});
