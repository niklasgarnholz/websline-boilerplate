import scripts from './partials/scripts';
import modules from './partials/modules';

const app = {
  init() {
    scripts.init();
    modules.init();
  },
};

app.init(); 