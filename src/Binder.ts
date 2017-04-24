import { $events } from "events-js";
import { onReady } from "./onReady";
import { BinderOptions, IBinderOptions } from "./BinderOptions";

export class IParsedBinder {
    scope: Object;
    binder: string;
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
                var parsedBinder: IParsedBinder = this.parseBinder(options.scope, item.getAttribute(this.binderAttribute));
                var scope = parsedBinder.scope;
                var binder = parsedBinder.binder;
                this.binders[binder] = this.binders[binder] || [];

                if (this.binders[binder].length === 0) {
                    var binderProperty = '$$_' + binder;
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
                            $$this.binders[binder].forEach((ele) => {
                                if (ele.tagName.toLowerCase() === 'input') {
                                    var inputElement = (<HTMLInputElement>ele);
                                    if (inputElement.attributes['type'] && inputElement.attributes['type'].value === 'text') {
                                        inputElement.value = value;
                                    }
                                } else {
                                    ele.innerHTML = value;
                                }
                            });
                        }
                    });
                }

                if (item.tagName.toLowerCase() === 'input' && item.attributes['type'] && item.attributes['type'].value === 'text') {
                    item.addEventListener('input', () => {
                        scope[binder] = (<HTMLInputElement>item).value;
                    });
                }

                this.binders[binder].push(item);
            })(this.elements.item(i));
        }

        this.$emit('ready');
    }

    parseBinder(scope: Object, binder: string): IParsedBinder {
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