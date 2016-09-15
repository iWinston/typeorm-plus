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
        // type: "sqlite",
        // storage: "temp/sqlitedb.db"
        type: "mssql",
        host: "192.168.1.10",
        username: "sa",
        password: "admin12345",
        database: "test",
    },
    logging: {
        logQueries: true,
        logFailedQueryError: true,
        logOnlyFailedQueries: true,
        logSchemaCreation: true
    },
    autoSchemaCreate: true,
    entities: [Post]
};

createConnection(options).then(connection => {

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.likesCount = 0;

    let postRepository = connection.getRepository(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"));

}, error => console.log("Cannot connect: ", error));