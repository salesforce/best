const REGEX_BRACKETS = /{{([\w]+)}}/g;

const DEFAULT_HTML =
`<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>{{benchmarkName}}</title>
  </head>
  <body>
    <script>window.BEST_CONFIG = { benchmarkName: "{{benchmarkName}}" }</script>
    <script src="{{benchmarkJS}}" type="text/javascript"></script>
  </body>
</html>
`;

export function generateParametrizedHTML(html, options) {
    return html.replace(REGEX_BRACKETS, (m, p) => options[p] || `{{undefined_${p}}}`);
}

export function generateDefaultHTML(options) {
    return generateParametrizedHTML(DEFAULT_HTML, options);
}
