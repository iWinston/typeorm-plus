import "reflect-metadata";
import {createConnection, ConnectionOptions} from "../../src/index";
import {Post} from "./entity/Post";

const options: ConnectionOptions = {
    driver: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test"
    },
    logging: {
        logOnlyFailedQueries: true,
        logFailedQueryError: true
    },
    autoSchemaCreate: true,
    entities: [Post]
};

createConnection(options).then(connection => {

    let postRepository = connection.getRepository(Post);

    const post = new Post();
    post.id = 1;
    post.type = "person";
    post.text = "this is test post";

    postRepository.persist(post)
        .then(savedPost => {
            console.log("Post has been saved: ", savedPost);
        })
        .catch(error => {
            console.log("error: ", error);
        });

}, error => console.log("Cannot connect: ", error));