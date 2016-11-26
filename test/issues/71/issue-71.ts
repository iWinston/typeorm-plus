import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Artikel} from "./entity/Artikel";
import {Kollektion} from "./entity/Kollektion";

describe.only("github issues > #71 ManyToOne relation with custom column name persistence fails", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    it("should persist successfully entity successfully with its many-to-one relation", () => Promise.all(connections.map(async connection => {

        const kollektion = new Kollektion();
        kollektion.name = "kollektion #1";

        const artikel = new Artikel();
        artikel.name = "artikel #1";
        artikel.nummer = "1";
        artikel.extrabarcode = "123456789";
        artikel.saison = "------";
        artikel.kollektion = kollektion;

        await connection.entityManager.persist(artikel);

        const loadedArtikel = await connection.entityManager
            .createQueryBuilder(Artikel, "artikel")
            .innerJoinAndSelect("artikel.kollektion", "kollektion")
            .where("artikel.id=:id", { id: 1 })
            .getSingleResult();

        expect(kollektion).not.to.be.empty;
        expect(loadedArtikel).not.to.be.empty;
        loadedArtikel.should.be.eql({
            id: 1,
            nummer: "1",
            name: "artikel #1",
            extrabarcode: "123456789",
            saison: "------",
            kollektion: {
                id: 1,
                name: "kollektion #1"
            }
        });
    })));

});