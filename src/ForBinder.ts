export interface IForElement {
    element: Element;
    binders: Element[];
}

export class ForBinder {
    public rebinder: (value:string) => void;
    public fullBinder: string;
    constructor(public root: Element, public elements: IForElement[] = []) {}

    isRoot(search: Element): boolean {
        return this.root === search;
    }

    hasForBinder(search: Element): boolean {
        for (var forElement of this.elements) {
            for (var element of forElement.binders) {
                if (element === search) return true;
            }
        }
        return false;
    }
}