export interface IBinderOptions {
    scope?: Object;
    binderPrefix?: string;
}

export class DefaultBinderOptions implements IBinderOptions {
   public scope: string | Object = window;
   public binderPrefix: string = 'jb';
}

export class BinderOptions extends DefaultBinderOptions {
    constructor(opts?: IBinderOptions) {
        super();
        if (opts) {
            this.scope = opts.scope ? opts.scope : this.scope;
            this.binderPrefix = opts.binderPrefix ? opts.binderPrefix : this.binderPrefix;
        }
    }
}