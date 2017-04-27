import { onReady } from "./onReady";
import { BinderOptions, IBinderOptions } from "./BinderOptions";
import { ForBinder } from "./ForBinder";

export interface IParsedBinder {
    scope: Object;
    binder: string;
    firstBinder: string;
    fullBinder: string;
}

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

export class Binder {
    private binders: Element[] = [];
    private forBinders: ForBinder[] = [];
    private binderSuffix: string = '-bind';
    private forSuffix: string = '-for';

    constructor(options = new BinderOptions()) {
        onReady(() => {
            this.bind(options);
        });
    }

    bind(options: IBinderOptions) {
        var binderAttribute = options.binderPrefix + this.binderSuffix;
        this.bindFor(options);
        var elements = document.querySelectorAll(this.getAttributeSelector(binderAttribute));
        this.bindElements(elements, options.scope, binderAttribute);
    }

    bindFor(options: IBinderOptions) {
        var binderAttribute = options.binderPrefix + this.binderSuffix;
        var forAttirbute = options.binderPrefix + this.forSuffix;
        var forElements = document.querySelectorAll(this.getAttributeSelector(forAttirbute));
        for (var i = 0; i < forElements.length; i++) {
            var forAttirbuteValues = forElements[i].getAttribute(forAttirbute).trim().split(" in ");
            if (forAttirbuteValues.length !== 2) continue;

            var forKey = forAttirbuteValues[0];
            
            var parsedForBinder = this.parseBinder(options.scope, forAttirbuteValues[1]);
            if (!parsedForBinder || !parsedForBinder.scope[parsedForBinder.binder] || parsedForBinder.scope[parsedForBinder.binder].length === 0) continue;
            var forScope: any[] = parsedForBinder.scope[parsedForBinder.binder];
            
            var forBinder = new ForBinder(forElements[i]);

            for (var j = 0; j < forScope.length; j++) {
                var forElement: Element = j === 0 ? forElements[i] : <Element>forElements[i].cloneNode(true);
                if (j !== 0) { 
                    forElement = forBinder.forElements[forBinder.forElements.length - 1].insertAdjacentElement('afterend', forElement);
                    forBinder.forElements.push(forElement);
                }
                var binders = forElement.querySelectorAll(this.getAttributeSelector(binderAttribute));
                this.bindElements(binders, forScope, binderAttribute, forKey, parsedForBinder.fullBinder, j);
                forBinder.forElements.push(forElement);
                for (var k = 0; k < binders.length; k++) {
                    forBinder.forBinders.push(binders[k]);
                }
            }
            this.forBinders.push(forBinder);
        }
    }

    private bindElements(elements: NodeListOf<Element>, rootScope: Object, binderAttribute: string, forKey?: string, forBinderValue?: string, forIndex?: number) {
        for (var i = 0; i < elements.length; i++) {
            ((item) => {
                var binderAttrValue = item.getAttribute(binderAttribute).trim();
                var parsedBinder: IParsedBinder = this.parseBinder(rootScope, binderAttrValue, forKey, forBinderValue, forIndex);

                if (parsedBinder) {
                    var isForBinder = false;
                    for (var i = 0; i < this.forBinders.length; i++) {
                        if (this.forBinders[i].hasForBinder(item)) {
                            isForBinder = true;
                            break;
                        };
                    }
                    if (!isForBinder) {
                        var scope = parsedBinder.scope;
                        var binder = parsedBinder.binder;
                        this.binders[parsedBinder.fullBinder] = this.binders[parsedBinder.fullBinder] || [];

                        if (this.binders[parsedBinder.fullBinder].length === 0) {
                            this.bindSetter(scope, binder, parsedBinder.fullBinder);
                        }

                        this.assignDefault(item, scope[binder]);
                        this.bindListeners(item, scope, binder);
                        this.binders[parsedBinder.fullBinder].push(item);
                    }
                }
            })(elements.item(i));
        }
    }

    private bindSetter(scope: Object, binder: string, binderAttrValue: string) {
        var binderProperty = '_$$__' + binder + '__$$_';
        Object.defineProperty(scope, binderProperty, {
            value: scope[binder],
            enumerable: false,
            writable: true
        });
        var $$this = this;
        Object.defineProperty(scope, binder, {
            get: function() {
                return this[binderProperty]
            },
            set: function(value) {
                this[binderProperty] = value;
                $$this.propertySetter(binderAttrValue, value);
            }
        });
    }

    private getAttributeSelector(attribute: string) {
        return '[' + attribute + ']:not([' + attribute + '=""])';
    }

    private propertySetter(binder: string, value: any) {
        this.binders[binder].forEach((ele: Element) => {
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

    private assignDefault(element: Element, value: any) {
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

    private bindListeners(ele: Element, scope: object, binder: string) {
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

    private parseBinder(scope: Object, binder: string, forKey?: string, forBinderValue?: string, forIndex?: number): IParsedBinder {
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
        return result;
    }
}