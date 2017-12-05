import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Animal} from "./entity/Animal";
import {NamingStrategyUnderTest} from "./naming/NamingStrategyUnderTest";


describe("github issue > #1282 FEATURE REQUEST - Naming strategy joinTableColumnName if it is called from the owning or owned (inverse) context ", () => {

    let connections: Connection[];
    let namingStrategy = new NamingStrategyUnderTest();

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        namingStrategy
    }));
    beforeEach(() => {
        return reloadTestingDatabases(connections);
    });
    after(() => closeTestingConnections(connections));


    it("NamingStrategyUnderTest#", () => Promise.all(connections.map(async connection => {

        await connection.getRepository(Animal).find();

        // make sure both functions
        expect(namingStrategy.calledJoinTableColumnName.length).greaterThan(0);

        expect(namingStrategy.calledJoinTableInverseColumnName.length).greaterThan(1);


    })));

});
