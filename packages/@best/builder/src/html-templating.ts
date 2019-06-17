// The '<!-- saved from ... -->' syntax is required to let IE know that this content is safe to execute.
// Full details are here: https://docs.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/ms537628(v=vs.85)
// Also, note that the line endings have to be <CR><LF> for Internet Explorer to correctly recognize the mark.
// Default line endings on mac and linux have just <LF>
const DEFAULT_HTML = `<!DOCTYPE html>
<!-- saved from url=(0016)http://localhost -->
<html>
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>{{benchmarkName}}</title>
  </head>
  <body>
    <script>window.BEST_CONFIG = { benchmarkName: "{{benchmarkName}}" }</script>
    <script src="{{benchmarkJs}}" type="text/javascript"></script>
  </body>
</html>
`;

export interface HtmlOptions {
    benchmarkName: string;
    benchmarkJs: string;
    htmlTemplate?: string;
}

export default function generateHTML({ benchmarkName, benchmarkJs, htmlTemplate = DEFAULT_HTML }: HtmlOptions) {
    return htmlTemplate
        .replace(/{{benchmarkName}}/g, benchmarkName)
        .replace('{{benchmarkJs}}', benchmarkJs);
}
