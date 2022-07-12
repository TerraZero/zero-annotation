/**
 * @param {import('./AnnotationParser')} parser 
 * @param {string} id 
 * @returns {Proxy}
 */
 module.exports = (parser, id) => {
  return new Proxy({service: null}, {
    get: (target, field, receiver) => {
      if (target.service === null) target.service = parser.getPlugin(id);
      if (target.service === null) {
        return () => {return null};
      } else {
        return Reflect.get(target.service, field, receiver);
      }
    },
  });
};

module.exports = class PluginCollection {

  /**
   * @param {import('./AnnotationParser')} parser 
   * @param {string[]} ids 
   */
  constructor(parser, ids) {
    this.parser = parser;
    this.ids = ids;
    this._plugins = null;
  }

  getPlugins() {
    if (this._plugins === null) {
      this._plugins = this.ids.map(v => this.parser.getPlugin(v));
    }
    return this._plugins;
  }

  each(callback) {
    for (const p of this.getPlugins()) callback(p);
    return this;
  }

  call(method, ...params) {
    const result = [];
    this.each(p => result.push(p[method](...params)));
    return result;
  }

}