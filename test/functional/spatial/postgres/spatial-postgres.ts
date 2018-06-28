import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../../src/connection/Connection";
import {
  closeTestingConnections,
  createTestingConnections,
  reloadTestingDatabases
} from "../../../utils/test-utils";
import { Post } from "./entity/Post";

describe("spatial-postgres", () => {
  let connections: Connection[];
  before(async () => {
    connections = await createTestingConnections({
      entities: [__dirname + "/entity/*{.js,.ts}"],
      enabledDrivers: ["postgres"]
    });
  });
  beforeEach(async () => {
    try {
      await reloadTestingDatabases(connections);
    } catch (err) {
      console.warn(err.stack);
      throw err;
    }
  });
  after(async () => {
    try {
      await closeTestingConnections(connections);
    } catch (err) {
      console.warn(err.stack);
      throw err;
    }
  });

  it("should create correct schema with Postgres' geometry type", () =>
    Promise.all(
      connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const schema = await queryRunner.getTable("post");
        await queryRunner.release();
        expect(schema).not.to.be.empty;
        expect(
          schema!.columns.find(
            tableColumn =>
              tableColumn.name === "geom" && tableColumn.type === "geometry"
          )
        ).to.not.be.empty;
      })
    ));

  it("should create correct schema with Postgres' geography type", () =>
    Promise.all(
      connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const schema = await queryRunner.getTable("post");
        await queryRunner.release();
        expect(schema).not.to.be.empty;
        expect(
          schema!.columns.find(
            tableColumn =>
              tableColumn.name === "geog" && tableColumn.type === "geography"
          )
        ).to.not.be.empty;
      })
    ));

  it("should create correct schema with Postgres' geometry indices", () =>
    Promise.all(
      connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        const schema = await queryRunner.getTable("post");
        await queryRunner.release();
        expect(schema).not.to.be.empty;
        expect(
          schema!.indices.find(
            tableIndex =>
              tableIndex.isSpatial === true &&
              tableIndex.columnNames.length === 1 &&
              tableIndex.columnNames[0] === "geom"
          )
        ).to.not.be.empty;
      })
    ));

  it("should persist geometry correctly", () =>
    Promise.all(
      connections.map(async connection => {
        const geom = {
          type: "Point",
          coordinates: [0, 0]
        };
        const recordRepo = connection.getRepository(Post);
        const post = new Post();
        post.geom = geom;
        const persistedPost = await recordRepo.save(post);
        const foundPost = await recordRepo.findOne(persistedPost.id);
        expect(foundPost).to.exist;
        expect(foundPost!.geom).to.deep.equal(geom);
      })
    ));

  it("should persist geography correctly", () =>
    Promise.all(
      connections.map(async connection => {
        const geom = {
          type: "Point",
          coordinates: [0, 0]
        };
        const recordRepo = connection.getRepository(Post);
        const post = new Post();
        post.geog = geom;
        const persistedPost = await recordRepo.save(post);
        const foundPost = await recordRepo.findOne(persistedPost.id);
        expect(foundPost).to.exist;
        expect(foundPost!.geog).to.deep.equal(geom);
      })
    ));
});
