class NodeVisitorState {
  state = {};
  config;

  constructor(config) {
    this.config = config;
  }

  addToNode(key, value) {
      if (key in this.state) {
          if (this.state[key].includes(value)) { return; }
          this.state[key].push(value);
      } else {
          this.state[key] = [value];
      }
  }

  removeFromNodes(value) {
      if (value in this.state) {
          delete this.state[value];
      }

      for (const [key, values] of Object.entries(this.state)) {
          let i = values.indexOf(value);
          if (i >= 0) {
              this.state[key] = values.splice(i, 1);
          }

          if (!Array.isArray(this.state[key]) || !this.state[key].length) {
            delete this.state[key];
          }
      }
  }

  getNode(key) {
      return this.state[key] || [];
  }
}

module.exports = {
  NodeVisitorState,
}
