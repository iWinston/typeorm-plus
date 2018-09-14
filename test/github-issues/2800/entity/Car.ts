import {Engine, Vehicle} from "./Vehicle";
import {ChildEntity, Column} from "../../../../src/index";

export class CarEngine extends Engine {

    @Column()
    public horsePower: number;

    @Column()
    public torque: number;

}

@ChildEntity()
export class Car extends Vehicle {

    @Column(type => CarEngine)
    public engine: CarEngine;

}