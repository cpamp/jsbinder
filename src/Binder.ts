import { onReady } from "./onReady";
import { BinderOptions, IBinderOptions } from "./BinderOptions";
import { ForBinder, IForElement } from "./ForBinder";
import { ForBinding } from "./ForBinding";
import { ElementBinding } from "./ElementBinding";

const binderSuffix: string = '-bind';
const forSuffix: string = '-for';

export class Binder {
    private binders: Element[] = [];
    private forBinders: ForBinder[] = [];

    constructor(options = new BinderOptions()) {
        onReady(() => {
            this.bind(options);
        });
    }

    bind(options: IBinderOptions = new BinderOptions()) {
        var binderAttribute = options.binderPrefix + binderSuffix;
        this.bindFor(options);
        var elements = document.querySelectorAll(ElementBinding.getAttributeSelector(binderAttribute));
        ElementBinding.bindElements(elements, options.scope, binderAttribute, this.binders, this.forBinders);
    }

    bindFor(options: IBinderOptions = new BinderOptions()) {
        var binderAttribute = options.binderPrefix + binderSuffix;
        var forAttirbute = options.binderPrefix + forSuffix;
        ForBinding.bindForElements(options.scope, binderAttribute, forAttirbute, this.forBinders, this.binders);
    }
}