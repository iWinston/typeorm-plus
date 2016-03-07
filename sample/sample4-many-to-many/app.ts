import {TypeORM} from "../../src/TypeORM";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";
import {PostCategory} from "./entity/PostCategory";
import {PostMetadata} from "./entity/PostMetadata";
import {PostImage} from "./entity/PostImage";
import {PostInformation} from "./entity/PostInformation";
import {PostAuthor} from "./entity/PostAuthor";

// first create a connection
let options = {
    host: "192.168.99.100",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    autoSchemaCreate: true
};

TypeORM.createMysqlConnection(options, [Post, PostDetails, PostCategory, PostMetadata, PostImage, PostInformation, PostAuthor]).then(connection => {

    /*
        let category1 = new Category();
        category1.name = "People";
    
        let category2 = new Category();
        category2.name = "Human";
    
        let post = new Post();
        post.text = "Hello how are you?";
        post.title = "hello";
        post.categories = [category1, category2];
    */

    // finally save it
    /*let postRepository = connection.getRepository<Post>(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));*/

}, error => console.log("Cannot connect: ", error));