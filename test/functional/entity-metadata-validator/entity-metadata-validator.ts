import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {setupTestingConnections} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {getConnectionManager} from "../../../src/index";

const should = chai.should();

describe("entity-metadata-validator", () => {

    let connections: Connection[];
    before(() => {
        connections = setupTestingConnections({ entities: [__dirname + "/entity/*{.js,.ts}"] })
            .map(options => getConnectionManager().create(options));
    });

    it("should throw error if relation count decorator used with ManyToOne or OneToOne relations", () => Promise.all(connections.map(async connection => {
        expect(() => connection.buildMetadatas()).to.throw(Error);
    })));

});