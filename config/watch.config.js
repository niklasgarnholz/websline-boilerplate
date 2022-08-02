const chokidar = require('chokidar');
const esbuild = require('esbuild');
const config = require('./config.json');

// sass
const sass = require('esbuild-sass-plugin');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// templates
const { TwigService } = require('./partials/twig');
const cmsMode = true;
const devMode = process.env.NODE_ENV === 'dev';

const [js, css, twig] = [config.js, config.css, config.twig].map((_config) => {
    return chokidar.watch(_config.watch, {
        ignored: _config.ignore,
        awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 100
        },
    });
})

// SCSS
css.on('change', (path) => {
    console.log(`[scss]: 💬 ${path} has changed`);

    esbuild.build({
        entryPoints: config.css.src,
        outdir: config.css.dist,
        sourcemap: devMode,
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

js.on('change', (path) => {
    console.log(`[js]: 💬 ${path} has changed`);

    esbuild.build({
        entryPoints: config.js.src,
        outdir: config.js.dist,
        bundle: true,
        sourcemap: devMode,
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
    distDir: config.twig.dist,
});

twig.on('all', (event, path) => {
    if (devMode) {
        console.log(`[template]: 💬 ${path} got event: ${event}`);
    }

    twigService.watchAllCb(event, path)
    .catch((e) => console.error(e));
});
