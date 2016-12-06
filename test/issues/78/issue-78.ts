import "reflect-metadata";
import {setupTestingConnections, closeConnections, reloadDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {DeliveryNote} from "./entity/DeliveryNote";
import {expect} from "chai";

describe("github issues > #78 repository 'create' is skipping inherited fields", () => {

    let connections: Connection[];
    before(async () => connections = await setupTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
    }));
    beforeEach(() => reloadDatabases(connections));
    after(() => closeConnections(connections));

    it("should persist successfully and return persisted entity", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(DeliveryNote);

        const deliveryNoteEntity = repository.create({
            id: 1,
            dollarRate: 0.5,
            orderBy: "money",
            comments: "this is comment",
            subTotal: 10,
            vat: 50,
            total: 60,
            createdBy: "Amir",
            invoice: "Total Invoice: 60"
        });

        expect(deliveryNoteEntity).not.to.be.empty;
        deliveryNoteEntity.should.be.instanceof(DeliveryNote);
        const simpleObject = Object.assign({}, deliveryNoteEntity);
        simpleObject.should.be.eql({
            dollarRate: 0.5,
            orderBy: "money",
            comments: "this is comment",
            subTotal: 10,
            vat: 50,
            total: 60,
            createdBy: "Amir",
            invoice: "Total Invoice: 60",
            id: 1
        });

    })));

});