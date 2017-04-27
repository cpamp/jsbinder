export interface IForBinder {
    rootFor: Element;
    forElements: IForElement[];
}

export interface IForElement {
    forElement: Element;
    binderElements: Element[];
}

export class ForBinder {
    constructor(public rootFor: Element, public forElements: IForElement[] = []) {}

    isRoot(search: Element): boolean {
        return this.rootFor === search;
    }

    hasForBinder(search: Element): boolean {
        for (var forElement of this.forElements) {
            for (var element of forElement.binderElements) {
                if (element === search) return true;
            }
        }
        return false;
    }
}