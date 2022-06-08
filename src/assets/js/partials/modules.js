// components
// import componentName from '../../../templates/components/component/name';

// development
// import gridOverlay from '../../../templates/elements/gridOverlay/gridOverlay';

const modulesArray = [
//  componentName,
//   gridOverlay,
];

const modules = {
  load() {
    if (modulesArray.length > 0) {
      modulesArray.forEach((module) => {
        module.init();
      });
    }
  },

  init() {
    this.load();
  },
};

export default modules;