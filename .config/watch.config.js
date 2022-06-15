const chokidar = require('chokidar');
const esbuild = require('esbuild');
const pkg = require('../package.json');

// sass
const sass = require('esbuild-sass-plugin');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// templates
const { TwigService } = require('./partials/twig');
const cmsMode = true;
const devMode = process.env.NODE_ENV === 'dev';

// SCSS

const scssWatcher = chokidar.watch('./src/**/*.scss', {
    awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
    },
});

scssWatcher.on('change', (path) => {
    console.log(`[scss]: 💬 ${path} has changed`);

    esbuild.build({
        entryPoints: [
            './src/assets/css/app.scss',
        ],
        outdir: pkg.dist.css,
        sourcemap: true,
        minify: !devMode,
        plugins: [
            sass.sassPlugin({
                async transform(source) {
                    const { css } = await postcss([autoprefixer])
                    .process(source, { from: undefined });
                    return css;
                },
            })
        ],
    })
    .then(() =>  console.log(`[scss]: ✅ Files has been compiled`))
    .catch((e) => console.error(e));
});


// JS

const jsWatcher = chokidar.watch('./src/**/*.js', {
    awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100
    },
});

jsWatcher.on('change', (path) => {
    console.log(`[js]: 💬 ${path} has changed`);

    esbuild.build({
        entryPoints: [
            './src/assets/js/app.js',
        ],
        outdir: pkg.dist.js,
        bundle: true,
        sourcemap: true,
        minify: !devMode,
    })
    .then(() =>  console.log(`[js]: ✅ Files has been compiled`))
    .catch((e) => console.error(e));
});

// Templates

const templatesDir = './src/templates';
const twigService = new TwigService({
    cmsMode,
    devMode,
    srcDir: templatesDir,
    distDir: pkg.dist.templates,
});

const templateWatcher = chokidar.watch([`${templatesDir}/**/*.{twig,json}`], {
    awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
    },
});

templateWatcher.on('all', (event, path) => {
    if (devMode) {
        console.log(`[template]: 💬 ${path} got event: ${event}`);
    }

    twigService.watchAllCb(event, path)
    .catch((e) => console.error(e));
});
