import { ForBinder } from "./ForBinder";
import { IfBinder } from "./IfBinder";

export interface IBinders {
    binders: Element[];
    forBinders: ForBinder[];
    ifBinders: IfBinder[];
}