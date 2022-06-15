const fs = require('fs');
const Path = require('path');
const { TwingFunction, TwingEnvironment, TwingLoaderFilesystem } = require('twing');
const minify = require('html-minifier').minify;
const { readFile, writeFile } = require('./utils');
const { NodeVisitor } = require('./twig.node-visitor');
const { NodeVisitorState } = require('./twig.node-visitor-state');

class TwigService {

    state;
    config;
    initRun;
    acceptedTypes = ['template', 'design', 'division'];
    updatedFiles = 0;
    timeouts = {};

    constructor(config) {
        this.state = new NodeVisitorState(config);
        this.config = config;
        this.initRun = true;
    }

    getTwingInstance(cache) {
        const loader = new TwingLoaderFilesystem(this.config.srcDir);
        const twing = new TwingEnvironment(loader, { 
            autoescape: false,
            cache: cache ? './.cache/' : false,
            auto_reload: true,
            source_map: true,
        });
        twing.addGlobal('cmsMode', this.config.cmsMode);
        twing.addGlobal('devMode', this.config.devMode);
        twing.addFunction(new TwingFunction('isCmsMode', () => Promise.resolve(this.config.cmsMode)));
        twing.addFunction(new TwingFunction('isDevMode', () => Promise.resolve(this.config.devMode)));
        return twing;
    }

    trackWrittenFile(path) {
        if (this.config.devMode) {
            console.log(`[template]: ✅ ${path} has written`);
        }

        this.updatedFiles += 1;
        clearTimeout(this.timeouts?.wf);
        this.timeouts.wf = setTimeout(() => {
            console.log(`[template]: updated ${this.updatedFiles} files`);
            this.updatedFiles = 0;
        }, 1000);
    }

    updateImporters(importers) {
        importers.forEach((path) => {
            let absPath = Path.posix.join(this.config.srcDir, path);
            if (fs.existsSync(absPath)) {
                this.watchAllCb('change', absPath);
            } else {
                // the file saved in the state has probably been moved or deleted
                this.state.removeFromNodes(path);
            }
        });
    }

    async watchAllCb(event, path) {
        if (!path) { return; }

        // paths
        path = Path.posix.normalize(path);
        const parsedPath = Path.parse(path);
        const jsonFile = Path.posix.format({ ...parsedPath, base: '', ext: '.json' });
        const twigFile = Path.posix.format({ ...parsedPath, base: '', ext: '.twig' });
        const relTwig = Path.posix.relative(this.config.srcDir, twigFile);
        const filename = parsedPath.name;

        // json stuff
        const hasJson = path === jsonFile || fs.existsSync(jsonFile);

        // twig stuff
        const nodeVisitor = new NodeVisitor(path, this.state);
        const twing = this.getTwingInstance(event !== 'add');
        const importers = this.state.getNode(relTwig);
        if (hasJson) { // only keep track of the relationship IMPORTED = […IMPORTER] if the IMPORTER is a rendered file
            twing.addNodeVisitor(nodeVisitor);
        }

        if (this.config.devMode) {
            clearTimeout(this.timeouts?.st);
            this.timeouts.st = setTimeout(() => {
                console.log(`[template]: current internal state of who gets imported by whom`, this.state.state);
            }, 1000);
        }

        // Do a dry run to build the dependency tree, and update it on newly added ones
        if (event === 'add' && path === twigFile) {
            if (!this.initRun) { // don't run this during the initial run
                // If any existing file is importing the newly added one, update them
                this.updateImporters(importers);
            }
            
            twing
            .render(relTwig, {})
            .catch((error) => {
                if (!error) { return; }
                console.error(`[template]: ❌ an error occurred while reading ${relTwig}`, error.message);
            });
        }

        if (event === 'change') {
            this.initRun = false;

            // Recursively render the files that are importing the current one
            this.updateImporters(importers);

            // Read JSON file
            if (!hasJson) { return; }
            const json = JSON.parse(await readFile(jsonFile));
            const dir = Path.join(this.config.distDir, json.type, json.key);
    
            // Check if json type is right
            if(!this.acceptedTypes.includes(json.type)) {
                return console.error(`[template]: ❌ ${path} can't be compiled because "${json.type}" is not accepted`);
            }
    
            // Create directory if it does not exists
            if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
    
            // Build JSON file
            const jsonDist = Path.format({ dir, name: filename, ext: '.json' });
            writeFile(jsonDist, JSON.stringify(json))
            .then(() => {
                this.trackWrittenFile(jsonDist);
            })
            .catch((error) => {
                return console.error(error);
            });

            // Build the HTML file
            const twigDist = Path.format({ dir, name: filename, ext: '.html' });
            twing
            .render(relTwig, {})
            .then((output) => {
                if (!this.config.devMode) {
                    output = minify(output, {
                        ignoreCustomFragments: [/[$[\s\S]*?$]/,/[$/[\s\S]*?$]/],
                        collapseWhitespace: true,
                        conservativeCollapse: false,
                        continueOnParseError: true
                    });
                }

                return writeFile(twigDist, output);
            })
            .then(() => {
                this.trackWrittenFile(twigDist);
            })
            .catch((error) => {
                console.error(`[template]: ❌ ${relTwig} can't be compiled because:`, error.message);
            });
        }

        if (event === 'unlink' && path === twigFile) {
            this.initRun = false;

            // Check if any other file imports this one and send out a warning
            if (importers.length) {
                console.warn(`[template]: 🚨 warning, due to moving or deleting "${relTwig}",\n\t the following files need to be updated to reflect that change\n\t`, importers);
                // this.state.removeFromNodes(relTwig);
            }
        }
    }
}

module.exports = {
    TwigService,
}
