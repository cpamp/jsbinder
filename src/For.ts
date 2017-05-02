import { Element } from "./Element";
import { ForBinder, IForElement } from "./ForBinder";
import { IAttributes } from "./IAttributes";
import { IBinders } from "./IBinders";
import { Setter } from "./Setter";

export module For {

    export function bindForElements(scope: Object, attributes: IAttributes, binders: IBinders) {
        var forElements = document.querySelectorAll(Element.getSelector(attributes.for));
        for (var i = 0; i < forElements.length; i++) {
            bindForElement(forElements[i], scope, attributes, binders);
        }
    }

    function bindForElement(element: Element, scope: Object, attributes: IAttributes, binders: IBinders) {
        (<HTMLElement>element).style.visibility = 'visible';
        var forAttirbuteValues = element.getAttribute(attributes.for).trim().split(" of ");
        if (forAttirbuteValues.length !== 2) return;

        var forKey = forAttirbuteValues[0];
        
        var parsedForBinder = Element.parseBinder(scope, forAttirbuteValues[1]);
        if (!parsedForBinder || !parsedForBinder.scope[parsedForBinder.binder] || parsedForBinder.scope[parsedForBinder.binder].length === 0) return;
        var forScope: any[] = parsedForBinder.scope[parsedForBinder.binder];

        var forBinder = new ForBinder(element);

        forBinder.rebinder = rebindFor(scope, attributes, forBinder, parsedForBinder, binders);
        binders.binders[parsedForBinder.fullBinder] = binders.binders[parsedForBinder.fullBinder] || [];
        if (binders.binders[parsedForBinder.fullBinder].length === 0) Setter.defineSetter(parsedForBinder, binders);
        defineArrayMutators(parsedForBinder.scope[parsedForBinder.binder], forBinder.rebinder);
        forBinder.fullBinder = parsedForBinder.fullBinder;

        if (parsedForBinder.scope[parsedForBinder.binder].$$undefinedBinder) {
            (<HTMLElement>element).style.visibility = 'hidden';
        } else {
            for (var j = 0; j < forScope.length; j++) {
                var forElement: Element = j === 0 ? element : <Element>element.cloneNode(true);
                if (j !== 0) { 
                    forElement = forBinder.elements[forBinder.elements.length - 1].element.insertAdjacentElement('afterend', forElement);
                }
                var forElementBinds: IForElement = {
                    element: forElement,
                    binders: []
                }
                var forBinderElements = forElement.querySelectorAll(Element.getSelector(attributes.bind));
                Element.bindElements(forBinderElements, scope, attributes, binders, forKey, parsedForBinder.fullBinder, j);
                for (var k = 0; k < forBinderElements.length; k++) {
                    forElementBinds.binders.push(forBinderElements.item(k));
                }
                forBinder.elements.push(forElementBinds);
            }
        }
        binders.forBinders.push(forBinder);
    }

    function defineArrayMutators(arrayObject: any[], rebinder: (value: any) => void) {
        const arrayMutators = [
            "copyWithin",
            "fill",
            "pop",
            "push",
            "reverse",
            "shift",
            "sort",
            "splice",
            "unshift"
        ];
        for (var method of arrayMutators) {
            defineArrayMutator(arrayObject, rebinder, method);
        }
    }

    function defineArrayMutator(arrayObject: any[], rebinder: (value:any) => void, method: string) {
        Object.defineProperty(arrayObject, method, {
            configurable: true,
            enumerable: false,
            writable: false,
            value: function () {
                var result = Array.prototype[method].apply(this, arguments);
                rebinder(this);
                return result;
            }
        });
    }

    function rebindFor(scope: Object, attributes: IAttributes, forBinder: ForBinder, parsedForBiner: Element.IParsedBinder, binders: IBinders): (value) => void {
        return (value) => {
            forBinder.elements.forEach((ele: IForElement) => {
                if (!forBinder.isRoot(ele.element)) {
                    ele.binders.forEach((binderEle: Element) => {
                        binderEle.remove();
                    });
                    ele.element.remove();
                }
            });
            for (var i = 0; i < binders.forBinders.length; i++) {
                if (forBinder === binders.forBinders[i]) {
                    binders.forBinders.splice(i, 1);
                }
            }
            bindForElement(<Element>forBinder.root, scope, attributes, binders);
        };
    }
}