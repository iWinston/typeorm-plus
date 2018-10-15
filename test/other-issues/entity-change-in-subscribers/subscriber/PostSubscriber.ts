/**
 * @copyright ActiveMedia Solutions LLC
 * @link http://activemedia.uz
 * @author Rustam Mamadaminov <rmamdaminov@gmail.com>.
 */
import {Post} from "../entity/Post";
import {EntitySubscriberInterface, EventSubscriber, UpdateEvent} from "../../../../src";
import {ColumnMetadata} from "../../../../src/metadata/ColumnMetadata";
import {RelationMetadata} from "../../../../src/metadata/RelationMetadata";

@EventSubscriber()
export class PostSubscriber implements EntitySubscriberInterface<Post> {
    listenTo() {
        return Post;
    }

    beforeUpdate(event: UpdateEvent<Post>) {
        event.entity.updatedColumns = event.updatedColumns.map((column: ColumnMetadata) => column.propertyName);
        event.entity.updatedRelations = event.updatedRelations.map((column: RelationMetadata) => column.propertyName);
    }

}