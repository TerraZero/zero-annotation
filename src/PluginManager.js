module.exports = class PluginManager {

  /**
   * @param {import('./AnnotationParser')} parser 
   */
  constructor(parser) {
    this.parser = parser;
  }

  /**
   * @param {(string|import('../types').T_PluginConfig)} id 
   */
  get(id) {
    if (typeof id === 'string') {
      id = this.getDefinition(id);
    }
    return this.create(id);
  }

  /**
   * @param {string} id 
   * @returns {import('../types').T_PluginConfig}
   */
  getDefinition(id) {
    return this.getDefinitions().find(v => v.id === id);
  }

  /**
   * @returns {import('../types').T_PluginConfig[]}
   */
  getDefinitions() {}

  /**
   * @param {import('../types').T_PluginConfig} definition 
   * @returns {any}
   */
  create(definition) {}

}