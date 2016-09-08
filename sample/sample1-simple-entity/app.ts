import "reflect-metadata";
import {createConnection, ConnectionOptions} from "../../src/index";
import {Post} from "./entity/Post";

const options: ConnectionOptions = {
    driver: {
        // type: "postgres",
        // host: "localhost",
        // port: 5432,
        // username: "root",
        // password: "admin",
        // database: "test"
        // type: "oracle",
        // host: "localhost",
        // username: "system",
        // password: "oracle",
        // sid: "XE",
        // port: 49161
        type: "sqlite",
        storage: "temp/sqlitedb.db"
    },
    logging: {
        logQueries: true,
        logSchemaCreation: true
    },
    autoSchemaCreate: true,
    entities: [Post]
};
/*const options: CreateConnectionOptions = {
    driver: "postgres",
    driverOptions: {
        host: "localhost",
        port: 5432,
        username: "test",
        password: "admin",
        database: "test",
        autoSchemaCreate: true,
        logging: {
            logQueries: true
        }
    },
    entities: [Post]
};*/

createConnection(options).then(connection => {

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.likesCount = 100;

    let postRepository = connection.getRepository(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));