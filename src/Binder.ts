import { $events } from "events-js";
import { onReady } from "./onReady";
import { BinderOptions, IBinderOptions } from "./BinderOptions";

export class IParsedBinder {
    scope: Object;
    binder: string;
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

export class Binder extends $events {
    private elements: NodeListOf<Element>;
    private binderAttribute: string;
    private binders: Element[] = [];

    constructor(options = new BinderOptions()) {
        super();
        onReady().then(() => {
            this.bind(options);
        });
    }

    bind(options: IBinderOptions) {
        this.binderAttribute = options.binderPrefix + '-bind';
        this.elements = document.querySelectorAll('[' + this.binderAttribute + ']:not([' + this.binderAttribute + '=""])')
        for (var i = 0; i < this.elements.length; i++) {
            ((item) => {
                var binderAttrValue = item.getAttribute(this.binderAttribute);
                var parsedBinder: IParsedBinder = this.parseBinder(options.scope, binderAttrValue);
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
            })(this.elements.item(i));
        }

        this.$emit('ready');
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
            binder: binder
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
        }
        return result;
    }
}