import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";
import {Abbreviation} from "./entity/Abbreviation";

describe("github issues > #215 invalid replacements of join conditions", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not do invalid replacements of join conditions", () => Promise.all(connections.map(async connection => {
        const sql = connection.entityManager
            .createQueryBuilder(Post, "p")
            .leftJoinAndMapOne("p.author", Author, "n", "p.author_id = n.id")
            .leftJoinAndMapOne("p.abbreviation", Abbreviation, "ab", "p.abbreviation_id = ab.id")
            .getGeneratedQuery();

        sql.should.be.equal("SELECT p.id AS p_id, p.author AS p_author, p.abbreviation AS " +
            "p_abbreviation, n.id AS n_id, n.name AS n_name, ab.id AS ab_id, ab.name AS " +
            "ab_name FROM post p LEFT JOIN author n ON p.author_id = n.id  LEFT JOIN " +
            "abbreviation ab ON p.abbreviation_id = ab.id");
    })));

});