const FS = require('fs');
const Path = require('path');
const Glob = require('glob');
const Handler = require('events');
const Annotation = require('./Annotation');
const DefaultPluginManager = require('./DefaultPluginManager');

module.exports = class AnnotationParser {

  constructor(options = {}) {
    this.options = options;
    this.commentRegex = /\s*\/\*\*(?<comment>(.|\n)+?)(?=\*\/)\*\/\s*(?<ident>[^\/\n]+)/gs;
    this.identRegex = /^\s*(.*class\s+(?<class>[a-zA-Z0-9]*)|(?<method>.+?(?=\()).*)\s*\{?\s*$/g;
    this.annotationRegex = /@(?<name>\S+)\s*(\{(?<type>.*?)(?=\})\})?(?<other>.*?)(?=(@|$))/gs;
    this.handler = new Handler();

    /** @type {Annotation[]} */
    this.registry = [];
    this._loaded = {};
    this._managers = {};
  }

  /**
   * @cache_loader
   * @param {object} object 
   */
  load(object) {
    this.registry = object.registry.map(v => {
      const annotation = Annotation.load(v);
      this._loaded[annotation.id] = annotation;
      return annotation;
    });
  }

  /**
   * @cache_saver
   * @returns {object}
   */
  save() {
    return {
      registry: this.registry.map(v => v.save()),
    };
  }

  getPlugin(id) {
    const split = id.split('.');
    const plugin = split.shift();
    if (this._managers[plugin]) {
      return this._managers[plugin].get(split.join('.'));
    }
    return null;
  }

  /**
   * @param {string} annotation 
   * @param {Object} definition 
   * @returns {DefaultPluginManager}
   */
  getPluginManager(annotation, definition = {}) {
    definition.annotation = annotation;
    if (this._managers[annotation] === undefined) {
      this._managers[annotation] = new DefaultPluginManager(this, definition);
    }
    return this._managers[annotation];
  }

  /**
   * @param {string} id 
   * @returns {Annotation}
   */
  get(id) {
    return this.registry.find(v => v.id === id);
  }

  /**
   * @param {string} annotation 
   * @returns {Annotation[]}
   */
  getByAnnotation(annotation) {
    return this.registry.filter(v => v.class.annotations[annotation]);
  }

  /**
   * @param {string} root
   * @param {string} glob
   * @returns {this}
   */
  read(root, glob) {
    const newDefinitions = [];
    Glob.sync(Path.join(root, glob), {
      absolute: true,
    }).forEach(path => {
      const content = FS.readFileSync(path) + '';
      newDefinitions.push(this.parse(content, root, path));
    });
    this.handler.emit('plugins', { load: newDefinitions, registry: this.registry, parser: this });
    this.registry = this.registry.concat(newDefinitions);
    return this;
  }

  /**
   * @param {string} content 
   * @param {string} root
   * @param {string} file
   * @returns {Annotation}
   */
  parse(content, root = null, file = null) {
    if (this._loaded[file] !== undefined) return this._loaded[file];

    const data = [];
    for (const match of content.matchAll(this.commentRegex)) {
      if (!match.groups.ident.trim()) continue;

      const annotation = {};

      for (const idMatch of match.groups.ident.matchAll(this.identRegex)) {
        if (idMatch.groups.class) {
          annotation.name = idMatch.groups.class;
          annotation.class = idMatch.groups.class;
          annotation.type = 'class';
        } else if (idMatch.groups.method) {
          const split = idMatch.groups.method.split(' ');

          annotation.name = split.pop();
          annotation.method = annotation.name;
          annotation.type = 'method';
          annotation.modifiers = split;
        }
      }

      for (const annoMatch of match.groups.comment.matchAll(this.annotationRegex)) {
        annotation.annotations = annotation.annotations || {};
        annotation.annotations[annoMatch.groups.name] = annotation.annotations[annoMatch.groups.name] || [];
        let value = null;
        let description = null;
        try {
          let other = annoMatch.groups.other.trim();
          if (other.startsWith('(')) {
            value = this.getInternBraces(other);
          }
          if (value && !value.startsWith('{') && !value.startsWith('[') && !value.startsWith('"')) {
            value = '"' + value + '"';
          }
          value = JSON.parse(value);
        } catch (e) {
          value = null;
        }
        annotation.annotations[annoMatch.groups.name].push({
          name: annoMatch.groups.name,
          type: annoMatch.groups.type,
          value: value,
          description: description,
        });
      }

      data.push(annotation);
    }
    const id = file;
    if (root && file) {
      file = file.substring(Path.normalize(root).length + 1);
    }
    this._loaded[id] = new Annotation(data, root, file);
    return this._loaded[id];
  }

  /**
   * @param {string} value 
   * @returns {string}
   */
  getInternBraces(value) {
    let number = null;
    let start = null;
    
    for (var i = 0, v = ''; v = value.charAt(i); i++) {
      if (v === '(') {
        number = (number || 0) + 1;
        start = start !== null ? start : i;
      } else if (v === ')') number--;
      if (number === 0) return value.substring(start + 1, i);
    }

    return null;
  }

  async call(definition, method, ...args) {
    if (Array.isArray(method)) {
      const Subject = this.getPlugin(method[0]);
      return await Subject[method[1]](...args);
    } else {
      const Subject = this.getPlugin(definition._annotation + '.' + definition.id);
      return await Subject[method](...args);
    }
  }

}