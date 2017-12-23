const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');
const mkdirp = require('mkdirp');
const stringLength = require('string-length');
const micromatch = require('micromatch');
const babel = require('babel-core');

const OK = chalk.reset.inverse.bold.green(' DONE ');
const SRC_DIR = 'src';
const BUILD_DIR = 'build';
const JS_FILES_PATTERN = '**/*.js';
const IGNORE_PATTERN = '**/__tests__/**';
const PACKAGES_DIR = path.resolve(__dirname, '../packages');
const transformOptions = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', '.babelrc'), 'utf8'));
transformOptions.babelrc = false;

const adjustToTerminalWidth = str => {
    const columns = process.stdout.columns || 80;
    const WIDTH = columns - stringLength(OK) + 1;
    const strs = str.match(new RegExp(`(.{1,${WIDTH}})`, 'g'));
    let lastString = strs[strs.length - 1];
    if (lastString.length < WIDTH) {
        lastString += Array(WIDTH - lastString.length).join(chalk.dim('.'));
    }
    return strs
        .slice(0, -1)
        .concat(lastString)
        .join('\n');
};

function getPackageName(file) {
    return path.relative(PACKAGES_DIR, file).split(path.sep)[0];
}

function getBuildPath(file, buildFolder) {
    const pkgName = getPackageName(file);
    const pkgSrcPath = path.resolve(PACKAGES_DIR, pkgName, SRC_DIR);
    const pkgBuildPath = path.resolve(PACKAGES_DIR, pkgName, buildFolder);
    const relativeToSrcPath = path.relative(pkgSrcPath, file);
    return path.resolve(pkgBuildPath, relativeToSrcPath);
}

function buildPackage(p) {
    const srcDir = path.resolve(p, SRC_DIR);
    const pattern = path.resolve(srcDir, '**/*');
    const files = glob.sync(pattern, { nodir: true });

    process.stdout.write(adjustToTerminalWidth(`${path.basename(p)}\n`));

    files.forEach(file => buildFile(file, true));
    process.stdout.write(`${OK}\n`);
}

function buildFile(file, silent) {
    const destPath = getBuildPath(file, BUILD_DIR);
    mkdirp.sync(path.dirname(destPath));

    if (micromatch.isMatch(file, IGNORE_PATTERN)) {
        silent || process.stdout.write(chalk.dim('  \u2022 ') + path.relative(PACKAGES_DIR, file) + ' (ignore)\n');
    } else if (!micromatch.isMatch(file, JS_FILES_PATTERN)) {
        fs.createReadStream(file).pipe(fs.createWriteStream(destPath));

        if (!silent) {
            process.stdout.write(
                chalk.red('  \u2022 ') +
                path.relative(PACKAGES_DIR, file) +
                chalk.red(' \u21D2 ') +
                path.relative(PACKAGES_DIR, destPath) +
                ' (copy)' +
                '\n'
            );
        }

    } else {
        const options = Object.assign({}, transformOptions);
        options.plugins = options.plugins.slice();

        const transformed = babel.transformFileSync(file, options).code;
        fs.writeFileSync(destPath, transformed);

        if (!silent) {
            process.stdout.write(
                chalk.green('  \u2022 ') +
                path.relative(PACKAGES_DIR, file) +
                chalk.green(' \u21D2 ') +
                path.relative(PACKAGES_DIR, destPath) +
                '\n'
            );
        }
    }
}

const getPackages = require('./_getPackages');
const packages = getPackages();
process.stdout.write(chalk.inverse(' Building packages \n'));
packages.forEach(buildPackage);
process.stdout.write('\n');
