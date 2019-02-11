import {PrimaryColumn} from "../../../../../../src/decorator/columns/PrimaryColumn";
import {Entity} from "../../../../../../src/decorator/entity/Entity";
import {Profile} from "./Profile";
import {OneToOne} from "../../../../../../src/decorator/relations/OneToOne";

@Entity()
export class User {

    @PrimaryColumn()
    id: number;

    @OneToOne(type => Profile, profile => profile.user, { cascade: ["insert"] })
    profile: Profile;

}
