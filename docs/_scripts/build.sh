#!/bin/bash

set -e

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

declare ASSETS_DIR="_assets"

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

update_index() {
    html-minifier-terser \
        --collapse-whitespace \
        --minify-css true \
        --minify-js true \
        --remove-comments \
        --remove-optional-tags \
        --remove-redundant-attributes \
        --remove-script-type-attributes \
        --remove-tag-whitespace \
        "_index.html" > "index.html"
}

update_scripts() {
    cat \
        "node_modules/docsify/lib/docsify.js" \
        "node_modules/docsify/lib/plugins/zoom-image.js" \
        "node_modules/docsify/lib/plugins/search.js" \
        "node_modules/docsify-copy-code/dist/docsify-copy-code.js" \
        "node_modules/docsify-toc/dist/toc.js" \
        "node_modules/docsify-sidebar-collapse/dist/docsify-sidebar-collapse.js" \
        "node_modules/prismjs/components/prism-bash.js" \
        "node_modules/prismjs/components/prism-javascript.js" \
        "node_modules/prismjs/components/prism-json.js" \
        "node_modules/prismjs/components/prism-yaml.js" \
            | terser \
                --compress \
                --mangle \
                --comments false \
                --output "$ASSETS_DIR/scripts.js"
}

update_styles() {
    cat \
        "node_modules/docsify/lib/themes/vue.css" \
        "node_modules/docsify-toc/dist/toc.css" \
            | sed -e 's/\@import\ url("https:\/\/fonts.googleapis.com\/css\?family=Roboto\+Mono|Source+Sans+Pro:300,400,600");//g' \
            | csso > "$ASSETS_DIR/styles.css"
}

# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

main() {
    update_index
    update_scripts
    update_styles
}

main
