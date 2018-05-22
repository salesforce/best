const REGEX_BRACKETS = /{{([\w]+)}}/g;

// The '<!-- saved from ... -->' syntax is required to let IE know that this content is safe to execute.
// Full details are here: https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/ms537628(v=vs.85)
// Also, note that the line endings have to be <CR><LF> for Internet Explorer to correctly recognize the mark.
// Default line endings on mac and linux have just <LF>
const DEFAULT_HTML = `<!DOCTYPE html>
<!-- saved from url=(0016)http://localhost -->
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
`.replace(/(\r\n|\r|\n)/g, '\r\n');

export function generateParametrizedHTML(html, options) {
    return html.replace(REGEX_BRACKETS, (m, p) => options[p] || `{{undefined_${p}}}`);
}

export function generateDefaultHTML(options) {
    let template = DEFAULT_HTML;
    if (Object.keys(options).indexOf("customTemplate") > -1) {
        template = options.customTemplate;
    }
    return generateParametrizedHTML(template, options);
}
