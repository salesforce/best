---
title: Installation
---

# Installation

::: tip
If you aren't familiar with build tools but want to explore Lightning Web Components, start coding in the [Playground](install#playground), which requires no installation.
:::

## Lightning Web Components CLI

To install Lightning Web Components and the Lightning Web Components CLI, use the open source `lwc-create-app` tool.

The CLI steps you through a simple build setup for an app.

```bash
npx lwc-create-app my-app
cd my-app
npm run watch
```

To install the CLI, you must have [Node.js](https://nodejs.org/) installed, with at least npm 5.2+. You should be familiar with either [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/). The npx tool is a package runner that installs with npm 5.2+.

For information about component naming and bundle structure, see [Component Bundles](reference#component-bundles).

## Tools

To develop Lightning web components, you can use just about any code editor and tools.

For code formatting, we recommend [Prettier](https://Prettier.io/). Prettier supports HTML, CSS, and Javascript, which are the files you write to create Lightning web components.

To install and use Prettier, see the official [documentation](https://Prettier.io/docs/en/install.html). If you're using Git, it's a good idea to use a [pre-commit hook](https://Prettier.io/docs/en/precommit.html) to ensure that code is formatted before it's committed to source control.

To configure Prettier, add a [configuration file](https://Prettier.io/docs/en/configuration.html) to your project. To correctly format HTML templates with Prettier, set the `parser` to `lwc`. The parser is just HTML, but it tells Prettier not to add quotes around template properties in HTML attributes as required by LWC.

The following example sets all HTML files to use the `lwc` parser.

```json
{
  "overrides": [
    {
      "files": "*.html",
       "options": { "parser": "lwc" }
    }
  ]
}
```

## Recipes

The [`github.com/trailheadapps/lwc-recipes-oss`](https://github.com/trailheadapps/lwc-recipes-oss) repo includes simple code recipes that teach you how to build apps. The recipes are used as code examples throughout this developer guide.

```bash
git clone https://github.com/trailheadapps/lwc-recipes-oss.git
cd lwc-recipes-oss
```

You can view some of the recipes in the Lightning Web Components recipes app: 
[recipes.lwc.dev](https://recipes.lwc.dev).

## Playground

The simplest recipe is the `helloWorld` component. The `name` property in the component's JavaScript class binds to the component's HTML template. Change `World` to `Earth` to see the binding in action.

Add another property in `helloWorld.js`.

```js
@api greeting = 'Welcome to Lightning Web Components!'
```

Don't forget to add `{greeting}` in the `helloWorld.html` template.

The `@api` decorator makes the `name` property public. Because the `name` and `greeting` properties are public, a component that consumes the `helloWorld` component can set their values.

If we remove `@api`, the property still binds to the HTML template but it's private. To see for yourself, remove `@api`.

To learn more, see [HTML Templates](html_templates).

## Supported Browsers

|  Browser  |  Version |
| --- | --- |
|Microsoft® Internet Explorer® | IE 11* |
|Microsoft® Edge| Latest |
|Google Chrome™|Latest |
|Mozilla® Firefox®| Latest|
|Apple® Safari®| 12.x+|

::: note
For IE 11, Lightning Web Components uses compatibility mode. Code is transpiled down to ES5 and the required polyfills are added. Components work in compatibility mode, but performance suffers. To develop Lightning web components that run in IE 11, follow the [Compat Performance](https://github.com/salesforce/eslint-plugin-lwc#compat-performance) rules in the ESLint Plugin for Lightning Web Components Github repo.
:::

## Supported JavaScript

To develop Lightning web components, use the latest versions of JavaScript.

Lightning Web Components JavaScript support includes:

- ES6 \(ECMAScript 2015\)
- ES7 \(ECMAScript 2016\)
- ES8 \(ECMAScript 2017\)—excluding Shared Memory and Atomics
- ES9 \(ECMAScript 2018\)—including only [Object Spread Properties](https://github.com/tc39/proposal-object-rest-spread) \(not Object Rest Properties\)

A huge benefit of Lightning Web Components is that you write standard JavaScript code. The Salesforce engineers who developed Lightning Web Components are contributing members of the Ecma International Technical Committee 39 \([TC39](https://tc39.github.io/ecma262/)\), which is the committee that evolves JavaScript. Salesforce is also a member of the [World Wide Web Consortium \(W3C\)](https://www.w3.org/Consortium/Member/List).

This developer guide explains how to develop Lightning web components and documents the [directives](reference#html-template-directives), [decorators](reference#javascript-decorators), and [lifecycle hooks](lifecycle) that are unique to the programming model.

This developer guide doesn’t document standard JavaScript or teach JavaScript fundamentals. Standard JavaScript is documented in the [Mozilla Developer Network \(MDN\) JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference). If you’re looking for documentation for a function, try MDN first. For example, if you’re looking for information about `addEventListener()`, use MDN.

::: tip
To learn JavaScript \(or if you want a refresher\), start with the [Modern JavaScript Development](https://trailhead.salesforce.com/en/content/learn/modules/modern-javascript-development?trail_id=learn-to-work-with-javascript) Trailhead module. In just an hour and fifteen minutes, you’ll be up-to-date and ready to develop Lightning web components.
:::
