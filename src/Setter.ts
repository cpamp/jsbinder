import { Element } from "./Element";
import { IBinders } from "./IBinders";
import { IAttributes } from "./IAttributes";
import { IForElement, ForBinder } from "./ForBinder";

export module Setter {
    export function defineSetter (parsedBinder: Element.IParsedBinder, binders: IBinders) {
        var binderProperty = binderProperty = '_$$__' + parsedBinder.binder + '__$$_';
        Object.defineProperty(parsedBinder.scope, binderProperty, {
            value: parsedBinder.scope[parsedBinder.binder],
            enumerable: false,
            writable: true
        });
        Object.defineProperty(parsedBinder.scope, parsedBinder.binder, {
            get: function() {
                return this[binderProperty]
            },
            set: function(value) {
                this[binderProperty] = value;
                propertySetter(binders, parsedBinder.fullBinder, value);
            }
        });
    }

    function propertySetter(binders: IBinders, binder: string, value: any) {
        binders.binders[binder].forEach((ele: Element) => {
            if (Element.isInputType.input(ele.tagName)) {
                var inputElement = (<HTMLInputElement>ele);
                var type = inputElement.type;
                if (Element.isInputType.textbox(type)) {
                    inputElement.value = value;
                } else if (Element.isInputType.options(type)) {
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
        binders.forBinders.forEach((forBinder) => {
            if (forBinder.fullBinder === binder) forBinder.rebinder(value);
        });
    }
}