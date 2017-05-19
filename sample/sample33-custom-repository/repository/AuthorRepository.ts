import {EntityRepository} from "../../../src/decorator/EntityRepository";
import {AbstractRepository} from "../../../src/repository/AbstractRepository";
import {Author} from "../entity/Author";

/**
 * Second type of custom repository - extends abstract repository (also can not extend anything).
 */
@EntityRepository(Author)
export class AuthorRepository extends AbstractRepository<Author> {

    createAndSave(firstName: string, lastName: string) {
        const author = new Author();
        author.firstName = firstName;
        author.lastName = lastName;

        return this.entityManager.save(author);
    }

    findMyAuthor() {
        return this
            .createQueryBuilder("author")
            .getOne();
    }

}