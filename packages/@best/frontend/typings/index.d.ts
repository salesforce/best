declare module '@lwc/rollup-plugin' {
    export default function lwc(): Plugin
}

declare module 'rollup-plugin-terser' {
    export function terser(): Plugin
}