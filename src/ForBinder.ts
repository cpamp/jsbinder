export interface IForBinder {
    rootFor: Element;
    forElements: Element[];
    forBinders: Element[];
}

export class ForBinder {
    constructor(public rootFor: Element, public forElements: Element[] = [], public forBinders: Element[] = []) {}

    isRoot(search: Element): boolean {
        return this.rootFor === search;
    }

    hasForElement(search: Element): boolean {
        for (var element of this.forElements) {
            if (element === search) return true;
        }
        return false;
    }

    hasForBinder(search: Element): boolean {
        for (var element of this.forBinders) {
            if (element === search) return true;
        }
        return false;
    }
}