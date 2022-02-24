const Path = require('path');
const PluginManager = require('./PluginManager');
const Reflection = require('pencl-kit/src/Util/Reflection');

module.exports = class DefaultPluginManager extends PluginManager {

  /**
   * @param {import('./AnnotationParser')} parser 
   * @param {import('../types').T_PluginDefinition} definition
   */
  constructor(parser, definition) {
    super(parser);
    this.definition = definition;
    this._definitions = null;
    this._factory = null;
    this._cache = {};

    parser.handler.on('plugins', ({ load }) => {
      if (this._definitions) {
        this.loadDefinitions(load.filter(v => v.class.annotations[this.definition.annotation]));
      }
    });
  }

  /**
   * @param {Function} factory 
   * @returns {this}
   */
  setFactory(factory) {
    this._factory = factory;
    return this;
  }

  /**
   * @param {import('../types').T_PluginConfig} definition 
   * @returns {any}
   */
  create(definition) {
    const args = [definition];
    for (const arg of definition._plugin.getClassAnnotations('args')) {
      args.push(this.parser.getPlugin(arg.value));
    }

    if (this._factory) return this._factory(this, definition, args);

    if (this._cache[definition.id]) return this._cache[definition.id];

    const Subject = require(Path.join(definition._plugin.root, definition._plugin.path));
    const creator = definition._plugin.getMethodsByAnnotation('plugin_creator', ['static']);
    let plugin = null;
    if (creator.length) {
      plugin = Subject[creator[0].name](definition, args);
    } else {
      plugin = new Subject(...args);
    }

    if (definition._plugin.getClassAnnotation('plugin_persist')) {
      this._cache[definition.id] = plugin;
    }
    return plugin;
  }

  /**
   * @param {string} id 
   * @returns {Object}
   */
  getDefinitions() {
    if (this._definitions !== null) return this._definitions;

    this._definitions = [];
    this.loadDefinitions(this.parser.getByAnnotation(this.definition.annotation));
    return this._definitions;
  }

  /**
   * @param {Annotation[]} annotations 
   */
  loadDefinitions(annotations) {
    const definitions = [];
    for (const plugin of annotations) {
      const definition = { _plugin: plugin, _annotation: this.definition.annotation };
        
      const annotation = plugin.getClassAnnotation(this.definition.annotation);
      this.addAnnotationDefinition(definition, annotation, this.definition);

      for (const field in this.definition.fields) {
        const fieldAnnotations = plugin.getClassAnnotations(field);

        this.addAnnotationDefinitionField(definition, fieldAnnotations, field, this.definition);
      }

      for (const methodAnnotation in this.definition.methods) {
        const methods = plugin.getMethodsByAnnotation(methodAnnotation);
        definition[methodAnnotation] = [];

        for (const method of methods) {
          let methodDefinition = { _plugin: plugin, _annotation: methodAnnotation, _method: method };

          this.addAnnotationDefinition(methodDefinition, method.annotations[methodAnnotation][0], this.definition.methods[methodAnnotation]);

          for (const field in this.definition.methods[methodAnnotation].fields) {
            this.addAnnotationDefinitionField(methodDefinition, method.annotations[field], field, this.definition.methods[methodAnnotation]);
          }
          definition[methodAnnotation].push(methodDefinition);
        }
      }
      definitions.push(definition);
      this._definitions.push(definition);
    }
    if (definitions.length) this.parser.handler.emit('plugins.' + this.definition.annotation, { manager: this, definitions });
  }

  /**
   * @param {import('../types').T_PluginDefinition} definition 
   * @param {string} name 
   * @param {any} fallback 
   * @returns {any}
   */
   getDefinitionField(definition, name, fallback = null) {
    if (definition.fields && Array.isArray(definition.fields[name])) {
      return definition.fields[name][0];
    } else {
      return definition.fields && definition.fields[name] || fallback;
    }
  }

  /**
   * @param {import('../types').T_PluginDefinition} definition 
   * @param {string} name 
   * @param {any} value 
   * @returns {any}
   */
  getDefinitionFieldValue(definition, name, value = undefined) {
    if (value !== undefined) return value;
    if (Array.isArray(definition.fields[name])) {
      return definition.fields[name][1];
    } else {
      return undefined;
    }
  }

  /**
   * @param {Object} definition 
   * @param {import('../types').T_Annotation} annotation 
   * @param {import('../types').T_PluginDefinition} pluginDefinition 
   */
  addAnnotationDefinition(definition, annotation, pluginDefinition) {
    if (Array.isArray(annotation.value)) {
      for (const index in pluginDefinition.main) {
        if (index == 0) {
          Reflection.setDeep(definition, this.getDefinitionField(pluginDefinition, pluginDefinition.main[index], 'id'), annotation.value[index]);
        } else {
          Reflection.setDeep(definition, this.getDefinitionField(pluginDefinition, pluginDefinition.main[index]), this.getDefinitionFieldValue(pluginDefinition, pluginDefinition.main[index], annotation.value[index]));
        }
      }
    } else {
      Reflection.setDeep(definition, this.getDefinitionField(pluginDefinition, pluginDefinition.main[0], 'id'), annotation.value);
    }
  }

  /**
   * 
   * @param {Object} definition 
   * @param {import('../types').T_Annotation[]} fieldAnnotations 
   * @param {string} field 
   * @param {import('../types').T_PluginDefinition} pluginDefinition 
   */
  addAnnotationDefinitionField(definition, fieldAnnotations, field, pluginDefinition) {
    if (!fieldAnnotations) {
      if (Reflection.getDeep(definition, this.getDefinitionField(pluginDefinition, field)) === null) {
        Reflection.setDeep(definition, this.getDefinitionField(pluginDefinition, field), this.getDefinitionFieldValue(pluginDefinition, field));
      }
    } else if (fieldAnnotations.length === 1) {
      Reflection.setDeep(definition, this.getDefinitionField(pluginDefinition, field), this.getDefinitionFieldValue(pluginDefinition, field, fieldAnnotations[0].value));
    } else {
      const values = [];
      for (const fieldAnnotation of fieldAnnotations) {
        values.push(this.getDefinitionFieldValue(pluginDefinition, field, fieldAnnotation.value));
      }
      Reflection.setDeep(definition, this.getDefinitionField(pluginDefinition, field), values);
    }
  }

}