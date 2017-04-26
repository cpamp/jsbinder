import { onReady } from "./onReady";
import { BinderOptions, IBinderOptions } from "./BinderOptions";

export class IParsedBinder {
    scope: Object;
    binder: string;
    firstBinder: string;
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
    private binderSuffix: string = '-bind';
    private forSuffix: string = '-for';

    constructor(options = new BinderOptions()) {
        onReady(() => {
            this.bind(options);
        });
    }

    bind(options: IBinderOptions) {
        var binderAttribute = options.binderPrefix + this.binderSuffix;
        var elements = document.querySelectorAll(this.getAttributeSelector(binderAttribute));
        this.bindElements(elements, options.scope, binderAttribute);
    }

    bindFor(options: IBinderOptions) {
        var binderAttribute = options.binderPrefix + this.binderSuffix;
        var forAttirbute = options.binderPrefix + this.forSuffix;
        var forElements = document.querySelectorAll(this.getAttributeSelector(forAttirbute));
        for (var i = 0; i < 0; i++) {
            var forAttirbuteValues = forElements[i].getAttribute(forAttirbute).trim();
            if (forAttirbuteValues.length !== 2) continue;

            var forKey = forAttirbuteValues[0],
                forScope = forAttirbuteValues[1];

            var parsedFor = this.parseBinder(options.scope, forScope);
            var scope = parsedFor.scope[parsedFor.binder];

            var binders = forElements[i].querySelectorAll(this.getAttributeSelector(binderAttribute));
        }
    }

    private bindElements(elements: NodeListOf<Element>, scope: Object, binderAttribute: string, rootScope: Object = null, forKey: string = null) {
        var forIndex = 0;
        for (var i = 0; i < elements.length; i++) {
            ((item) => {
                var binderAttrValue = item.getAttribute(binderAttribute).trim();
                var parsedBinder: IParsedBinder = this.parseBinder(scope, binderAttrValue);
                if (!parsedBinder) {
                    if (rootScope != null) {
                        parsedBinder = this.parseBinder(rootScope, binderAttrValue);
                    }
                } else {
                    if (parsedBinder.firstBinder === forKey) forIndex++;
                }

                if (parsedBinder) {

                    var scope = parsedBinder.scope;
                    var binder = parsedBinder.binder;
                    this.binders[binderAttrValue] = this.binders[binderAttrValue] || [];

                    if (this.binders[binderAttrValue].length === 0) {
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

                    this.assignDefault(item, scope[binder]);
                    this.bindListeners(item, scope, binder);
                    this.binders[binderAttrValue].push(item);
                }
            })(elements.item(i));
        }
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

    private parseBinder(scope: Object, binder: string): IParsedBinder {
        var result: IParsedBinder = {
            scope: scope,
            binder: binder,
            firstBinder: binder
        }
        var binders = binder.split('.');
        if (binders.length > 1) {
            var currentScope = scope[binders[0]];
            for (var i = 1; i < binders.length - 1; i++) {
                if (currentScope[binders[i]] != null) currentScope = currentScope[binders[i]];
                else return null;
            }
            result.scope = currentScope;
            result.binder = binders[binders.length - 1];
            result.firstBinder = binders[0];
        }
        return result;
    }
}