import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Tag} from "./entity/Tag";
import {PostWithoutRelationId} from "./entity/PostWithoutRelationId";

const should = chai.should();

describe("QueryBuilder > relation-id > one-to-many", () => {
    
    // todo: make this feature to work with FindOptions
    // todo: also make sure all new qb features to work with FindOptions
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("with RelationId decorator", function() {


    });

    describe("without RelationId decorator", function() {

        it("should load id when loadRelationIdAndMap used with OneToMany relation", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "cars";
            await connection.entityManager.persist(tag);

            const post1 = new PostWithoutRelationId();
            post1.title = "about BMW";
            post1.tag = tag;
            await connection.entityManager.persist(post1);

            const post2 = new PostWithoutRelationId();
            post2.title = "about Audi";
            post2.tag = tag;
            await connection.entityManager.persist(post2);

            let loadedTag = await connection.entityManager
                .createQueryBuilder(Tag, "tag")
                .loadRelationIdAndMap("tag.postIds", "tag.postsWithoutRelationId")
                .getOne();

            expect(loadedTag!.postIds).to.not.be.empty;
            expect(loadedTag!.postIds.length).to.be.equal(2);
            expect(loadedTag!.postIds[0]).to.be.equal(1);
            expect(loadedTag!.postIds[1]).to.be.equal(2);
        })));

        it("should load id when loadRelationIdAndMap used with OneToMany relation and additional condition", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "cars";
            await connection.entityManager.persist(tag);

            const post1 = new PostWithoutRelationId();
            post1.title = "about BMW";
            post1.tag = tag;
            await connection.entityManager.persist(post1);

            const post2 = new PostWithoutRelationId();
            post2.title = "about Audi";
            post2.tag = tag;
            await connection.entityManager.persist(post2);

            let loadedTag = await connection.entityManager
                .createQueryBuilder(Tag, "tag")
                .loadRelationIdAndMap("tag.postIds", "tag.postsWithoutRelationId", "postsWithoutRelationId", qb => qb.where("postsWithoutRelationId.id = :postId", { postId: 1 }))
                .getOne();

            expect(loadedTag!.postIds).to.not.be.empty;
            expect(loadedTag!.postIds.length).to.be.equal(1);
            expect(loadedTag!.postIds[0]).to.be.equal(1);
        })));

    });

});