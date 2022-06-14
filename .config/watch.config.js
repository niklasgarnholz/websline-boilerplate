const chokidar = require('chokidar');
const esbuild = require('esbuild');
const config = require('./.config.json');
const pkg = require('../package.json');

// sass
const sass = require('esbuild-sass-plugin');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');

// templates
const fs = require('fs');
const Path = require('path');
const { TwingEnvironment, TwingLoaderFilesystem, TwingOutputHandler } = require('twing');
const minify = require('html-minifier').minify; 


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
        sourcemap: true,
        minify: false,
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
        sourcemap: true,
    })
    .then(() =>  console.log(`[js]: ✅ Files has been compiled`))
    .catch((e) => console.error(e));
});

// Templates

function readFile(_path) {
    return new Promise((resolve, reject) => {
        fs.readFile(_path, 'utf8', (e, data) => {
            if(e) return reject(console.error(e));
            return resolve(data);
        })
    })
}

twig.on('change', (path) => {
    console.log(`[template]: 💬 ${path} has changed`);

    const jsonFile = Path.format({ ...Path.parse(path), base: '', ext: '.json' });
    const hasJson = fs.existsSync(jsonFile);
    const acceptedTypes = ['template', 'design', 'division'];
    const filename = Path.parse(path).name;

    if (!hasJson) return console.log(`[template]: ❌ ${jsonFile} is missing`);

    // Read JSON file
    readFile(jsonFile).then((_json) => {
        const json = JSON.parse(_json);
        const dir = Path.join(config.twig.dist, json.type, json.key);

        // Check if json type is right
        if(!acceptedTypes.includes(json.type)) return console.log(`[template]: ❌ ${path} can't be compiled because "${json.type}" is not accepted`);   

        // Create directory if it not exists
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        // Build JSON file
        const jsonDist = Path.join(dir, filename + '.json');

        fs.writeFile(jsonDist, JSON.stringify(json), (e) => {
            if(e) return console.error(e);
            console.log(`[template]: ✅ ${jsonDist} has written`);
        });

        // Build Twig file
        const templatePath = 'src/templates';
        const loader = new TwingLoaderFilesystem('./' + templatePath);
        const twing = new TwingEnvironment(loader, { 
            autoescape: false,
            source_map: true
        });

        const twigSrc = Path.format({ ...Path.parse(path), base: '', ext: '.twig' });
        const twigDist = Path.join(dir, filename + '.html');

        twing
        .render(twigSrc.replace(templatePath,''), {})
        .then((_data) => {
            const minifiedData = minify(_data, {
                ignoreCustomFragments: [/[$[\s\S]*?$]/,/[$/[\s\S]*?$]/],
                collapseWhitespace: true,
                conservativeCollapse: false,
                continueOnParseError: true
            });

            fs.writeFile(twigDist, minifiedData, (e) => {
                if(e) return console.error(e);
                console.log(`[template]: ✅ ${twigDist} has written`);
            });
        });

    });

});




