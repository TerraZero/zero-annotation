const FS = require('fs');
const Path = require('path');
const Glob = require('glob');
const Annotation = require('./Annotation');

module.exports = class AnnotationParser {

  constructor(options = {}) {
    this.options = options;
    this.commentRegex = /\s*\/\*\*(?<comment>(.|\n)+?)(?=\*\/)\*\/\s*(?<ident>[^\/\n]+)/gs;
    this.identRegex = /^\s*(.*class\s+(?<class>[a-zA-Z]*)|(?<method>.+?(?=\()).*)\s*\{?\s*$/g;
    this.annotationRegex = /@(?<name>\S+)\s*(\{(?<type>.+?)(?=\})\}\s*)?(\((?<settings>.+?)(?=\))\)\s*)?(?<description>.*)$/gm;

    /** @type {Annotation[]} */
    this.registry = [];
    this._loaded = {};
  }

  /**
   * @param {string} id 
   */
  get(id) {
    return this.registry.find(v => v.id === id);
  }

  getByAnnotation(annotation) {
    return this.registry.filter(v => v.class.annotations[annotation]);
  }

  /**
   * @param {string} root
   * @param {string} glob
   * @returns {this}
   */
  load(root, glob) {
    Glob.sync(Path.join(root, glob), {
      absolute: true,
    }).forEach(path => {
      const content = FS.readFileSync(path) + '';
      this.registry.push(this.parse(content, root, path));
    });
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
        let settings = null;
        try {
          settings = JSON.parse(annoMatch.groups.settings);
        } catch (e) {}
        annotation.annotations[annoMatch.groups.name].push({
          name: annoMatch.groups.name,
          type: annoMatch.groups.type,
          settings: settings,
          description: annoMatch.groups.description,
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

}