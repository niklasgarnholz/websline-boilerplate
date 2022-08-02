const Path = require('path');
const { TwingBaseNodeVisitor, TwingNodeExpressionConstant } = require('twing');

class NodeVisitor extends TwingBaseNodeVisitor {

  state;
  rootFile;

  constructor(rootFile, state) {
      super();
      this.state = state;
      this.setRootFile(rootFile);
  }

  getPriority() {
      return 1;
  }

  /**
   * Called before child nodes are visited.
   *
   * @returns {TwingNode} The modified node
   */
  doEnterNode(node, env) {
      try {
          if (node instanceof TwingNodeExpressionConstant
              && node?.name?.endsWith('.twig')
              && node?.attributes?.has('value')) {
              let imported = node.attributes.get('value');
              
              if ('string' === typeof imported && imported.endsWith('.twig')) {
                  // imported = Path.posix.normalize(imported);
                  if (imported !== this.rootFile) {
                      this.state.addToNode(imported, this.rootFile);
                  }
              }
          }
      } catch (error) {
          console.error(error);
      }

      return node;
  }

  /**
   * Called after child nodes are visited.
   *
   * @returns {TwingNode|false} The modified node or null if the node must be removed
   */
  doLeaveNode(node, env) {
      return node;
  }

  setRootFile(rootFile) {
      this.rootFile = Path.posix.relative(this.state.config.srcDir, rootFile);
  }
}

module.exports = {
  NodeVisitor,
}
