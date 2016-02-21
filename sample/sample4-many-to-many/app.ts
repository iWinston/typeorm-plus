import {TypeORM} from "../../src/TypeORM";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

// first create a connection
let options = {
    host: "192.168.99.100",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    autoSchemaCreate: true
};

TypeORM.createMysqlConnection(options, [Post, Category]).then(connection => {

    let category1 = new Category();
    category1.name = "People";

    let category2 = new Category();
    category2.name = "Human";

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.categories = [category1, category2];

    // finally save it
    let postRepository = connection.getRepository<Post>(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));