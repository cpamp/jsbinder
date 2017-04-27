export interface IForBinder {
    rootFor: Element;
    forElements: IForElement[];
}

export interface IForElement {
    forElement: Element;
    binderElements: Element[];
}

export class ForBinder {
    constructor(public rootFor: Element, public forElements: IForElement[] = [], public forBinders: Element[] = []) {}

    isRoot(search: Element): boolean {
        return this.rootFor === search;
    }

    hasForBinder(search: Element): boolean {
        for (var element of this.forBinders) {
            if (element === search) return true;
        }
        return false;
    }
}