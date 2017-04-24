import { $events } from "events-js";
import { onReady } from "./onReady";
import { BinderOptions } from "./BinderOptions";

export class Binder extends $events {
    private elements: NodeListOf<Element>;
    private binderAttribute: string;
    private binders: Element[] = [];

    constructor(private options = new BinderOptions()) {
        super();
        this.binderAttribute = options.binderPrefix + '-bind';
        onReady().then(() => {
            this.elements = document.querySelectorAll('[' + this.binderAttribute + ']:not([' + this.binderAttribute + '=""])')
            for (var i = 0; i < this.elements.length; i++) {
                ((item) => {
                    var binder = item.getAttribute(this.binderAttribute);
                    var scope = options.scope;
                    this.binders[binder] = this.binders[binder] || []
                    
                    if (typeof options.scope === 'string') {
                        scope = window[options.scope];
                    }
                    item.innerHTML = scope[binder];
                    item.nodeValue = scope[binder];

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
                                    if (ele.tagName.toLowerCase() === 'input' && ele.attributes['type'] && ele.attributes['type'].value === 'text') {
                                        ele.attributes['value'] = value;
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
        });
    }
}