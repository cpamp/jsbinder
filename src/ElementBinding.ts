import { ForBinder } from "./ForBinder";


export namespace ElementBinding {
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

    export function bindElements(elements: NodeListOf<Element>, rootScope: Object, binderAttribute: string, binders: Element[], forBinders: ForBinder[], forKey?: string, forBinderValue?: string, forIndex?: number) {
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

    export function bindSetter(parsedBinder: IParsedBinder, binders: Element[], customSetter: Function = null) {
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

    export function getAttributeSelector(attribute: string) {
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

    export interface IParsedBinder {
        scope: Object;
        binder: string;
        firstBinder: string;
        fullBinder: string;
    }

    export function parseBinder(scope: Object, binder: string, forKey?: string, forBinderValue?: string, forIndex?: number): IParsedBinder {
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
}