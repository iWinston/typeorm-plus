import {TypeORM} from "../../src/TypeORM";
import {Post} from "./entity/Post";
import {Comment} from "./entity/Comment";

// first create a connection
let options = {
    host: "192.168.99.100",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    autoSchemaCreate: true
};

TypeORM.createMysqlConnection(options, [Post, Comment]).then(connection => {

    let comment1 = new Comment();
    comment1.text = "Hello world";
    let comment2 = new Comment();
    comment2.text = "Bye world";

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.comments = [comment1, comment2];

    // finally save it
    let postRepository = connection.getRepository<Post>(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));