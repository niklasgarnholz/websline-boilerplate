const pkg =  require('./package');

module.exports = {
    defaults: {
        twig: true,
        scss: true,
        js: false,
        config: false,
    },
    fileHeader: {
        authors: pkg.authors,
        projectName: pkg.projectName,
    },
    files: {
        twig: {
            name: '',
            postfix: '',
            extension: 'twig',
            description: 'ferdi should create a Template File'
        },
        scss: {
            name: '',
            postfix: '',
            extension: 'scss',
            description: 'ferdi should create Stylesheet File'
        },
        js: {
            name: '',
            postfix: '',
            extension: 'js',
            description: 'ferdi should create JavaScript File'
        },
        config: {
            name: '',
            postfix: '',
            extension: 'json',
            description: 'ferdi should create JSON File'
        },
    },
    paths: {
        templateBase: 'ferdi/',
        modulePath: 'src/templates/',
        pathOptions: {
            components: 'components/',
            elements: 'elements/',
            websline: 'websline/',
        },
    },
};