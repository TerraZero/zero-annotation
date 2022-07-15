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

  async asyncCall(method, ...params) {
    const result = [];
    for (const p of this.getPlugins()) result.push(await p[method](...params));
    return result;
  }

}