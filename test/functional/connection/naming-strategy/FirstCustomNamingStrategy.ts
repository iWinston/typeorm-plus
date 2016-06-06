import {DefaultNamingStrategy} from "../../../../src/naming-strategy/DefaultNamingStrategy";
import {NamingStrategy} from "../../../../src/decorator/NamingStrategy";
import {NamingStrategyInterface} from "../../../../src/naming-strategy/NamingStrategyInterface";

@NamingStrategy("firstCustomNamingStrategy")
export class FirstCustomNamingStrategy extends DefaultNamingStrategy implements NamingStrategyInterface {

    tableName(className: string, customName: string): string {
        return customName ? customName.toUpperCase() : className.toUpperCase();
    }
    
}