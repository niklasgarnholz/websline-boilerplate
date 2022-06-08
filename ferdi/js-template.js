/*<% 
  var splittedPath = modulePath.split('/');
  var simple = splittedPath.length === 1 || splittedPath[0] === splittedPath[1];
  var mn = simple ? moduleName : splittedPath[0] + moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  var cn = pathOptions.key.charAt(0) + (pathOptions.key.charAt(0) == 'w' ? 'l' : '') + '-' + mn;
  var directory = pathOptions.key.charAt(0) == 'e' ? 'elements' : pathOptions.key.charAt(0) == 'w' ? 'websline' : 'components';
  var path = simple ? splittedPath[0] + '/' + splittedPath[0] : splittedPath[0] + '/' + splittedPath[1];
%>
 * <%= mn %>
 * modules.js: import <%= mn %> from '../../../templates/<%= directory %>/<%= path %>';
 */

const <%= mn %> = {
    cfg:  {
        name: '<%= mn %>',
        selectors: {
            root: '.<%= cn %>',
        },
        classes: {
        },
        el: {
            $<%= mn %>: undefined,
        },
    },

    setElements() {
        this.cfg.el.$<%= mn %> = document.querySelector(this.cfg.selectors.root);
    },

    addEventListeners() {

    },

    init() {
        console.debug(`Init: ${this.cfg.name}`);
        this.setElements();

        if (this.cfg.el.$<%= mn %>) {
            this.addEventListeners();
        }
    },
};

export default <%= mn %>;
  