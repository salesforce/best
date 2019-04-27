declare module 'jsonwebtoken' {
    export function sign(payload?: any, cert? :string, obj?: any): any;
}
