import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Ticket} from "./entity/Ticket";
import {Request} from "./entity/Request";
import {expect} from "chai";

describe("github issues > #161 joinAndSelect can't find entity from inverse side of relation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,        
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should persist class table child successfully", () => Promise.all(connections.map(async connection => {

        const request = new Request();
        request.owner = "Umed";

        const ticket = new Ticket();
        ticket.name = "ticket #1";
        ticket.request = request;

        await connection.entityManager.persist(ticket);

        const loadedTicketWithRequest = await connection.entityManager.findOneById(Ticket, 1, {
            alias: "ticket",
            innerJoinAndSelect: {
                "request": "ticket.request"
            }
        });

        expect(loadedTicketWithRequest).not.to.be.empty;
        loadedTicketWithRequest!.should.be.eql({
            id: 1,
            name: "ticket #1",
            request: {
                id: 1,
                owner: "Umed"
            }
        });

        const loadedRequestWithTicket = await connection.entityManager.findOneById(Request, 1, {
            alias: "request",
            innerJoinAndSelect: {
                "ticket": "request.ticket"
            }
        });

        loadedRequestWithTicket!.should.be.eql({
            id: 1,
            owner: "Umed",
            ticket: {
                id: 1,
                name: "ticket #1"
            }
        });

    })));

});
