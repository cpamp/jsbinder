import { onReady } from "./onReady";
import { BinderOptions, IBinderOptions } from "./BinderOptions";
import { ForBinder, IForElement } from "./ForBinder";

export interface IParsedBinder {
    scope: Object;
    binder: string;
    firstBinder: string;
    fullBinder: string;
}

export class Binder {
    private binders: Element[] = [];
    private forBinders: ForBinder[] = [];

    constructor(options = new BinderOptions()) {
        onReady(() => {
            this.bind(options);
        });
    }

    bind(options: IBinderOptions) {
        var binderAttribute = options.binderPrefix + binderSuffix;
        this.bindFor(options);
        var elements = document.querySelectorAll(getAttributeSelector(binderAttribute));
        bindElements(elements, options.scope, binderAttribute, this.binders, this.forBinders);
    }

    bindFor(options: IBinderOptions) {
        var binderAttribute = options.binderPrefix + binderSuffix;
        var forAttirbute = options.binderPrefix + forSuffix;
        var forElements = document.querySelectorAll(getAttributeSelector(forAttirbute));
        for (var i = 0; i < forElements.length; i++) {
            bindForElement(forElements[i], options.scope, binderAttribute, forAttirbute, this.forBinders, this.binders);
        }
    }
}


const binderSuffix: string = '-bind';
const forSuffix: string = '-for';

const inputTypes = {
    text: "text",
    checkbox: 'checkbox',
    radio: 'radio',
    password: 'password',
    email: 'email',
    number: 'number'
}

const isInputType = {
    input: function(tagname: string): boolean {
        tagname = tagname.toLowerCase();
        return tagname === 'input';
    },
    textbox: function(type: string): boolean {
        type = type.toLowerCase();
        return type === inputTypes.text ||
            type === inputTypes.password ||
            type === inputTypes.email ||
            type === inputTypes.number;
    },
    options: function(type: string): boolean {
        type = type.toLowerCase();
        return type === inputTypes.radio ||
            type === inputTypes.checkbox;
    }
}

function bindForElement(element: Element, scope: Object, binderAttribute: string, forAttribute: string, forBinders: ForBinder[], binderEles: Element[]) {
    (<HTMLElement>element).style.visibility = 'visible';
    var forAttirbuteValues = element.getAttribute(forAttribute).trim().split(" of ");
    if (forAttirbuteValues.length !== 2) return;

    var forKey = forAttirbuteValues[0];
    
    var parsedForBinder = parseBinder(scope, forAttirbuteValues[1]);
    if (!parsedForBinder || !parsedForBinder.scope[parsedForBinder.binder] || parsedForBinder.scope[parsedForBinder.binder].length === 0) return;
    var forScope: any[] = parsedForBinder.scope[parsedForBinder.binder];

    var forBinder = new ForBinder(element);

    ((forBinder: ForBinder) => {
        var rebinder = rebindFor(element, scope, binderAttribute, forAttribute, forBinder, parsedForBinder, forBinders, binderEles);
        bindSetter(parsedForBinder, binderEles, rebinder);
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
            var binders = forElement.querySelectorAll(getAttributeSelector(binderAttribute));
            bindElements(binders, forScope, binderAttribute, binderEles, forBinders, forKey, parsedForBinder.fullBinder, j);
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

function rebindFor(element: Element, scope: Object, binderAttribute: string, forAttribute: string, forBinder: ForBinder, parsedForBiner: IParsedBinder, forBinders: ForBinder[], binders: Element[]): Function {
    return () => {
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

function bindElements(elements: NodeListOf<Element>, rootScope: Object, binderAttribute: string, binders: Element[], forBinders: ForBinder[], forKey?: string, forBinderValue?: string, forIndex?: number) {
    for (var i = 0; i < elements.length; i++) {
        ((item) => {
            var isForBinder = false;
            for (var i = 0; i < forBinders.length; i++) {
                if (forBinders[i].hasForBinder(item)) {
                    isForBinder = true;
                    break;
                };
            }
            if (!isForBinder) {
                var binderAttrValue = item.getAttribute(binderAttribute).trim();
                var parsedBinder: IParsedBinder = parseBinder(rootScope, binderAttrValue, forKey, forBinderValue, forIndex);

                if (parsedBinder) {
                    var scope = parsedBinder.scope;
                    var binder = parsedBinder.binder;
                    bindSetter(parsedBinder, binders);
                    assignDefault(item, scope[binder]);
                    bindListeners(item, scope, binder);
                    binders[parsedBinder.fullBinder].push(item);
                }
            }
        })(elements.item(i));
    }
}

function bindSetter(parsedBinder: IParsedBinder, binders: Element[], customSetter: Function = null) {
    var binder = parsedBinder.binder,
        scope = parsedBinder.scope,
        binderAttrValue = parsedBinder.fullBinder,
        binderProperty = '_$$__' + binder + '__$$_';

    binders[binderAttrValue] = binders[binderAttrValue] || [];

    if (binders[binderAttrValue].length === 0) {
        Object.defineProperty(scope, binderProperty, {
            value: scope[binder],
            enumerable: false,
            writable: true
        });
        Object.defineProperty(scope, binder, {
            get: function() {
                return this[binderProperty]
            },
            set: function(value) {
                this[binderProperty] = value;
                propertySetter(binders, binderAttrValue, value);
                if (typeof customSetter === 'function') customSetter();
            }
        });
    }
}

function getAttributeSelector(attribute: string) {
    return '[' + attribute + ']:not([' + attribute + '=""])';
}

function propertySetter(binders: Element[], binder: string, value: any) {
    binders[binder].forEach((ele: Element) => {
        if (isInputType.input(ele.tagName)) {
            var inputElement = (<HTMLInputElement>ele);
            var type = inputElement.type;
            if (isInputType.textbox(type)) {
                inputElement.value = value;
            } else if (isInputType.options(type)) {
                if (inputElement.value === value) {
                    inputElement.checked = true;
                } else {
                    inputElement.checked = false;
                }
            }
        } else {
            ele.innerHTML = value;
        }
    });
}

function assignDefault(element: Element, value: any) {
    if (isInputType.input(element.tagName)) {
        var inputElement = (<HTMLInputElement>element);
        var type = inputElement.type;
        if (isInputType.textbox(type)) {
            inputElement.value = value;
        } else if (isInputType.options(type)) {
            if (inputElement.value === value) {
                inputElement.checked = true;
            } else {
                inputElement.checked = false;
            }
        }
    } else {
        element.innerHTML = value;
    }
}

function bindListeners(ele: Element, scope: object, binder: string) {
    if (isInputType.input(ele.tagName)) {
        var inputElement = (<HTMLInputElement>ele);
        var type = inputElement.type;
        if (isInputType.textbox(type)) {
            inputElement.addEventListener('input', () => {
                scope[binder] = type === inputTypes.number && inputElement.value !== '' ?
                    parseFloat(inputElement.value) : inputElement.value;
            });
        } else if (isInputType.options(type)) {
            inputElement.addEventListener('change', () => {
                if (inputElement.checked === true) {
                    scope[binder] = inputElement.value;
                } else {
                    scope[binder] = '';
                }
            });
        }
    }
}

function parseBinder(scope: Object, binder: string, forKey?: string, forBinderValue?: string, forIndex?: number): IParsedBinder {
    var result: IParsedBinder = {
        scope: scope,
        binder: binder,
        firstBinder: binder,
        fullBinder: binder
    }
    var binders = binder.split('.');
    var currentScope = scope[binders[0]];
    var fullBinder;
    if (forKey != null && forIndex != null && forBinderValue != null && binders[0] === forKey) {
        if (scope[forIndex]) {
            currentScope = scope[forIndex];
            fullBinder = forBinderValue + '.' + forIndex;
            result.binder = forIndex.toString();
        }
    }
    if (binders.length > 1) {
        fullBinder = fullBinder || binders[0];
        for (var i = 1; i < binders.length - 1; i++) {
            if (currentScope[binders[i]] != null) {
                currentScope = currentScope[binders[i]];
                fullBinder += '.' + binders[i];
            }
            else return null;
        }
        result.binder = binders[binders.length - 1];
        result.scope = currentScope;
        fullBinder += '.' + result.binder;
    }
    result.firstBinder = binders[0];
    result.fullBinder = fullBinder || result.fullBinder;
    if (result.scope && result.scope[result.binder] === void 0) result.scope[result.binder] = { $$undefinedBinder: true };
    return result;
}