import { Element } from "./Element";
import { ForBinder, IForBinder, IForElement } from "./ForBinder";

export module For {

    export function bindForElements(scope: Object, binderAttribute: string, forAttribute: string, forBinders: ForBinder[], binders: Element[]) {
        var forElements = document.querySelectorAll(Element.getSelector(forAttribute));
        for (var i = 0; i < forElements.length; i++) {
            bindForElement(forElements[i], scope, binderAttribute, forAttribute, forBinders, binders);
        }
    }

    function bindForElement(element: Element, scope: Object, binderAttribute: string, forAttribute: string, forBinders: ForBinder[], binderEles: Element[]) {
        (<HTMLElement>element).style.visibility = 'visible';
        var forAttirbuteValues = element.getAttribute(forAttribute).trim().split(" of ");
        if (forAttirbuteValues.length !== 2) return;

        var forKey = forAttirbuteValues[0];
        
        var parsedForBinder = Element.parseBinder(scope, forAttirbuteValues[1]);
        if (!parsedForBinder || !parsedForBinder.scope[parsedForBinder.binder] || parsedForBinder.scope[parsedForBinder.binder].length === 0) return;
        var forScope: any[] = parsedForBinder.scope[parsedForBinder.binder];

        var forBinder = new ForBinder(element);

        ((forBinder: ForBinder) => {
            var rebinder = rebindFor(element, scope, binderAttribute, forAttribute, forBinder, parsedForBinder, forBinders, binderEles);
            binderEles[parsedForBinder.fullBinder] = binderEles[parsedForBinder.fullBinder] || [];
            if (binderEles[parsedForBinder.fullBinder].length === 0) Element.defineSetter(parsedForBinder, rebinder);
            defineArrayMutators(parsedForBinder.scope[parsedForBinder.binder], rebinder);
        })(forBinder);

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
                var binders = forElement.querySelectorAll(Element.getSelector(binderAttribute));
                Element.bindElements(binders, forScope, binderAttribute, binderEles, forBinders, forKey, parsedForBinder.fullBinder, j);
                for (var k = 0; k < binders.length; k++) {
                    forElementBinds.binders.push(binders[k]);
                }
                forBinder.elements.push(forElementBinds);
            }
        }
        forBinders.push(forBinder);
    }

    function defineArrayMutators(arrayObject: any[], rebinder: Function) {
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

    function defineArrayMutator(arrayObject: any[], rebinder: Function, method: string) {
        Object.defineProperty(arrayObject, method, {
            configurable: true,
            enumerable: false,
            writable: false,
            value: function () {
                var result = Array.prototype[method].apply(this, arguments);
                rebinder();
                return result;
            }
        });
    }

    function rebindFor(element: Element, scope: Object, binderAttribute: string, forAttribute: string, forBinder: ForBinder, parsedForBiner: Element.IParsedBinder, forBinders: ForBinder[], binders: Element[]): (value) => void {
        return (value) => {
            forBinder.elements.forEach((ele: IForElement) => {
                if (!forBinder.isRoot(ele.element)) {
                    ele.binders.forEach((binderEle: Element) => {
                        binderEle.remove();
                    });
                    ele.element.remove();
                }
            });
            for (var i = 0; i < forBinders.length; i++) {
                if (forBinder === forBinders[i]) {
                    forBinders.splice(i, 1);
                }
            }
            bindForElement(<Element>forBinder.root, scope, binderAttribute, forAttribute, forBinders, binders);
        };
    }
}