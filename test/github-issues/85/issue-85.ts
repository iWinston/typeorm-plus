import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Document} from "./entity/Document";
import {expect} from "chai";

describe("github issues > #85 - Column option insert: false, update: false", () => {

    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

  it("should be able to have a non-inserted Column", () => Promise.all(connections.map(async connection => {
    const queryRunner = connection.createQueryRunner();
    await queryRunner.dropColumn("document", "permission");

    const doc1 = new Document();
    doc1.id = 1;
    await connection.manager.save(doc1);
    const docs = connection.getRepository(Document);
    expect(await docs.count()).to.eql(1);

    await queryRunner.dropColumn("document", "name");

    const doc2 = new Document();
    doc2.id = 2;
    return connection.manager.save(doc2).should.be.rejected;
  })));
});

