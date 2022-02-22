/**
 * @typedef {Object} T_Annotation
 * @property {string} name
 * @property {string} [type]
 * @property {(string|Object|boolean)} [value]
 * @property {string} [description]
 */

/**
 * @typedef {Object} T_AnnotationItem
 * @property {string} name
 * @property {string} [class]
 * @property {string} [method]
 * @property {string} type
 * @property {string[]} modifiers
 * @property {Object<string, T_Annotation>} annotations
 */

/**
 * @typedef {Object} T_PluginDefinition
 * @property {string} annotation
 * @property {string[]} main
 * @property {Object<string, (string|string[])>} fields
 * @property {Object<string, T_PluginDefinition>} methods
 */

/**
 * @typedef {Object} T_PluginConfig
 * @property {import('./src/Annotation')} _plugin
 * @property {string} _annotation
 * @property {string} id
 */

module.exports = {};