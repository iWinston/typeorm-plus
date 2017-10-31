import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("persistence > entity updation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({ __dirname }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should update generated auto-increment id after saving", () => Promise.all(connections.map(async connection => {

    })));

    it("should update generated uuid after saving", () => Promise.all(connections.map(async connection => {

    })));

    it("should update default values after saving", () => Promise.all(connections.map(async connection => {

    })));

    it("should update special columns saving", () => Promise.all(connections.map(async connection => {

    })));

});
