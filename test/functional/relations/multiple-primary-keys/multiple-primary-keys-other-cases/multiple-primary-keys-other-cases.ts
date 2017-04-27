import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {User} from "./entity/User";
import {EventMember} from "./entity/EventMember";
import {Event} from "./entity/Event";

const should = chai.should();

describe("relations > multiple-primary-keys > other-cases", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load related entity when entity uses relation ids as primary id", () => Promise.all(connections.map(async connection => {

        const user1 = new User();
        user1.name = "Alice";
        await connection.entityManager.persist(user1);

        const user2 = new User();
        user2.name = "Bob";
        await connection.entityManager.persist(user2);

        const user3 = new User();
        user3.name = "Clara";
        await connection.entityManager.persist(user3);

        const event1 = new Event();
        event1.name = "Event #1";
        await connection.entityManager.persist(event1);

        const event2 = new Event();
        event2.name = "Event #2";
        await connection.entityManager.persist(event2);

        const eventMember1 = new EventMember();
        eventMember1.user = user1;
        eventMember1.event = event1;
        await connection.entityManager.persist(eventMember1);

        const eventMember2 = new EventMember();
        eventMember2.user = user2;
        eventMember2.event = event1;
        await connection.entityManager.persist(eventMember2);

        const eventMember3 = new EventMember();
        eventMember3.user = user1;
        eventMember3.event = event2;
        await connection.entityManager.persist(eventMember3);

        const eventMember4 = new EventMember();
        eventMember4.user = user3;
        eventMember4.event = event2;
        await connection.entityManager.persist(eventMember4);

        const loadedEvents = await connection.entityManager
            .createQueryBuilder(Event, "event")
            .leftJoinAndSelect("event.members", "members")
            .leftJoinAndSelect("members.user", "user")
            .orderBy("event.id, user.id")
            .getMany();

        expect(loadedEvents[0].members).to.not.be.empty;
        expect(loadedEvents[0].members[0].user.id).to.be.equal(1);
        expect(loadedEvents[0].members[0].user.name).to.be.equal("Alice");
        expect(loadedEvents[0].members[1].user.id).to.be.equal(2);
        expect(loadedEvents[0].members[1].user.name).to.be.equal("Bob");
        expect(loadedEvents[1].members).to.not.be.empty;
        expect(loadedEvents[1].members[0].user.id).to.be.equal(1);
        expect(loadedEvents[1].members[0].user.name).to.be.equal("Alice");
        expect(loadedEvents[1].members[1].user.id).to.be.equal(3);
        expect(loadedEvents[1].members[1].user.name).to.be.equal("Clara");

        const loadedUsers = await connection.entityManager
            .createQueryBuilder(User, "user")
            .leftJoinAndSelect("user.members", "members")
            .leftJoinAndSelect("members.event", "event")
            .orderBy("user.id, event.id")
            .getMany();

        expect(loadedUsers[0].members).to.not.be.empty;
        expect(loadedUsers[0].members[0].event.id).to.be.equal(1);
        expect(loadedUsers[0].members[0].event.name).to.be.equal("Event #1");
        expect(loadedUsers[0].members[1].event.id).to.be.equal(2);
        expect(loadedUsers[0].members[1].event.name).to.be.equal("Event #2");
        expect(loadedUsers[1].members).to.not.be.empty;
        expect(loadedUsers[1].members[0].event.id).to.be.equal(1);
        expect(loadedUsers[1].members[0].event.name).to.be.equal("Event #1");
        expect(loadedUsers[2].members).to.not.be.empty;
        expect(loadedUsers[2].members[0].event.id).to.be.equal(2);
        expect(loadedUsers[2].members[0].event.name).to.be.equal("Event #2");

    })));

});