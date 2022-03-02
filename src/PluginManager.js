module.exports = class PluginManager {

  /**
   * @param {import('./AnnotationParser')} parser 
   */
  constructor(parser) {
    this.parser = parser;
  }

  /**
   * @param {import('../types').C_SearchPredicate} predicate 
   * @returns {any[]}
   */
  search(predicate) {
    return this.getDefinitions().filter((v, i, l) => {
      return predicate(v, i, (v, m) => Array.isArray(v) ? v.includes(m) : v === m, l)
    }).map(this.create.bind(this));
  }

  /**
   * @param {(string|import('../types').T_PluginConfig)} id 
   */
  get(id) {
    if (typeof id === 'string') {
      id = this.getDefinition(id);
    }
    if (!id) return null;
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
  getDefinitions() { }

  /**
   * @param {import('../types').T_PluginConfig} definition 
   * @returns {any}
   */
  create(definition) { }

}