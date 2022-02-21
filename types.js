/**
 * @typedef {Object} T_Annotation
 * @property {string} name
 * @property {string} [type]
 * @property {(string|Object|boolean)} [settings]
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

module.exports = {};