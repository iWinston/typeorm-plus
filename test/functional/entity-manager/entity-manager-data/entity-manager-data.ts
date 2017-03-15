import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe.skip("entity manager > custom data", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should set data into entity manager and retrieve it successfully", () => Promise.all(connections.map(async connection => {

        const user = { name: "Dima" };
        connection.entityManager.setData("user", user);
        expect(connection.entityManager.getData("user")).to.be.not.empty;
        connection.entityManager.getData("user").should.be.equal(user);

    })));

    it("change in subscriber should update data set in entity manager", () => Promise.all(connections.map(async connection => {

        const user = { name: "Dima" };
        connection.entityManager.setData("user", user);

        const post = new Post();
        post.title = "New post";
        await connection.entityManager.persist(post);

        expect(connection.entityManager.getData("user")).to.be.not.empty;
        connection.entityManager.getData("user").should.be.eql({ name: "Updated Dima" });

    })));

});
