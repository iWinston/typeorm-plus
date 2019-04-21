import { Connection } from "../../../src";
import { createTestingConnections, reloadTestingDatabases, closeTestingConnections } from "../../utils/test-utils";
import { User } from "./entity/User";

describe("github issues > #4007 Support array of ValueTransformer in column options", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should apply two transformers", () => Promise.all(connections.map(async connection => {
        const userRepository = await connection.getRepository(User);
        const email = "JOhn@doe.com";
        const user = new User();
        user.email = email;

        await userRepository.save(user);

        const dbUser = await userRepository.findOne();
        dbUser && dbUser.email.should.be.eql(email.toLocaleLowerCase());

    })));
});