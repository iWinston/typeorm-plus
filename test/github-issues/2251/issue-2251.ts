import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import {
  closeTestingConnections,
  createTestingConnections,
  reloadTestingDatabases
} from "../../utils/test-utils";
import { Bar } from "./entity/Bar";

describe("github issues > #2251 - Unexpected behavior when passing duplicate entities to repository.save()", () => {
  let connections: Connection[];
  before(
    async () =>
      (connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
      }))
  );

  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should update all entities", () =>
    Promise.all(
      connections.map(async connection => {
        const repo = connection.getRepository(Bar);

        await repo.save([{ description: "test1" }, { description: "test2" }]);

        let bars = await repo.find();
        await repo.save([
          { id: 1, description: "test1a" },
          { id: 2, description: "test2a" },
          { id: 1, description: "test1a" },
          { id: 2, description: "test2a" }
        ]);

        bars = await repo.find();

        expect(bars.length).to.equal(2);

      })
    ));
});
