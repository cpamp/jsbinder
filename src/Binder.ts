import { onReady } from "./onReady";
import { IBinderOptions } from "./IBinderOptions";
import { ForBinder, IForElement } from "./ForBinder";
import { For } from "./For";
import { Element } from "./Element";
import { IAttributes } from "./IAttributes";
import { IfBinder } from "./IfBinder";

const binderSuffix: string = '-bind';
const forSuffix: string = '-for';
const ifSuffix: string = '-if';

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
    public binders: Element[] = [];
    public forBinders: ForBinder[] = [];
    public ifBinders: IfBinder[] = [];

    constructor(options?: IBinderOptions) {
        options = getOptions(options);
        onReady(() => {
            this.bind(options);
        });
    }

    bind(options: IBinderOptions) {
        options = getOptions(options);
        var attributes: IAttributes = {
            if: options.prefix + ifSuffix,
            for: options.prefix + forSuffix,
            bind: options.prefix + binderSuffix
        }
        For.bindForElements(options.scope, attributes, this);
        var elements = document.querySelectorAll(Element.getSelector(attributes.bind));
        Element.bindElements(elements, options.scope, attributes, this);
    }

    bindFor(options: IBinderOptions) {
        
    }
}