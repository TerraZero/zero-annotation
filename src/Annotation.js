module.exports = class Annotation {

  /**
   * @cache_loader
   * @param {Object} object 
   * @returns {Annotation}
   */
  static load(object) {
    return new Annotation(object.data, object.root, object.path);
  }

  /**
   * @param {import('../types').T_AnnotationItem[]} data 
   * @param {string} root
   * @param {string} path 
   */
  constructor(data, root, path = null) {
    this.data = data;
    this.root = root;
    this.path = path;
    this.file = null;
    this.ns = null;

    if (path) {
      const split = path.split('/');

      this.file = split.pop();
      this.ns = split.join('/');
    }
  }

  /**
   * @cache_saver
   * @returns {Object}
   */
  save() {
    return {
      data: this.data,
      root: this.root,
      path: this.path,
    };
  }

  get id() {
    return this.ns + '/' + this.class.name;
  }

  /** @returns {import('../types').T_AnnotationItem} */
  get class() {
    return this.data.find(v => v.type === 'class');
  }

  /** @returns {import('../types').T_AnnotationItem[]} */
  get methods() {
    return this.data.filter(v => v.type === 'method');
  }

  /**
   * @param {string} annotation 
   * @returns {import('../types').T_Annotation[]}
   */
  getClassAnnotations(annotation) {
    return this.class.annotations[annotation] || [];
  }

  /**
   * @param {string} annotation 
   * @param {number} index
   * @returns {(import('../types').T_Annotation|null)}
   */
  getClassAnnotation(annotation, index = 0) {
    return this.class.annotations[annotation] && this.class.annotations[annotation][index] || null;
  }

  /** @returns {import('../types').T_AnnotationItem} */
  getMethod(name) {
    return this.methods.find(v => v.name === name);
  }

  /**
   * @param {string} annotation 
   * @returns {import('../types').T_AnnotationItem[]}
   */
  getMethodsByAnnotation(annotation, modifiers = []) {
    return this.methods.filter(v => v.annotations[annotation] && modifiers.reduce((r, m) => r && v.modifiers.includes(m), true));
  }

}