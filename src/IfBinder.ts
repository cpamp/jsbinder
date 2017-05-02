import { Element } from "./Element";

export enum Comparitor {
    Less = 1 << 0,
    Equal = 1 << 1,
    Greater = 1 << 2,
    Not = 1 << 3,
    NotEqual = Comparitor.Not | Comparitor.Equal,
    LessEqual = Comparitor.Less | Comparitor.Equal,
    GreaterEqual = Comparitor.Greater | Comparitor.Equal
}

export class IfBinder {
    constructor(public left: Element.IParsedBinder | number,
                public right: Element.IParsedBinder | number,
                public comparitor: Comparitor) { }

    hasBinder(fullBinder: string) {
        if (typeof this.left === 'object') {
            
        }
    }
}