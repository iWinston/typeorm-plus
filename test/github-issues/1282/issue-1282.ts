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

        // joinTbelColumnName was called at least twice
        expect(namingStrategy.calls.length).greaterThan(1);

        // the first call was with inverse=false - i.e. for the owning part of the relation
        expect(namingStrategy.calls[0]).to.be.false;

        // the second call was with invers=true - i.e. for the owned part of the relation
        expect(namingStrategy.calls[1]).to.be.true;

    })));

});
