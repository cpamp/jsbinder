import { onReady } from "./onReady";
import { IBinderOptions } from "./IBinderOptions";
import { ForBinder, IForElement } from "./ForBinder";
import { For } from "./For";
import { Element } from "./Element";

const binderSuffix: string = '-bind';
const forSuffix: string = '-for';

const defaultOptions: IBinderOptions = {
    scope: window,
    prefix: 'jb'
}

function getOptions(options: IBinderOptions): IBinderOptions {
    if (!options) return defaultOptions;
    return {
        scope: options.scope || defaultOptions.scope,
        prefix: options.prefix || defaultOptions.prefix
    }
}

export class Binder {
    private binders: Element[] = [];
    private forBinders: ForBinder[] = [];

    constructor(options?: IBinderOptions) {
        options = getOptions(options);
        onReady(() => {
            this.bind(options);
        });
    }

    bind(options: IBinderOptions) {
        options = getOptions(options);
        var binderAttribute = options.prefix + binderSuffix;
        this.bindFor(options);
        var elements = document.querySelectorAll(Element.getSelector(binderAttribute));
        Element.bindElements(elements, options.scope, binderAttribute, this.binders, this.forBinders);
    }

    bindFor(options: IBinderOptions) {
        options = getOptions(options)
        var binderAttribute = options.prefix + binderSuffix;
        var forAttirbute = options.prefix + forSuffix;
        For.bindForElements(options.scope, binderAttribute, forAttirbute, this.forBinders, this.binders);
    }
}