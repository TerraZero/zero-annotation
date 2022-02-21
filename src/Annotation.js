module.exports = class Annotation {

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
   * @returns {import('../types').T_Annotation}
   */
  getClassAnnotation(annotation) {
    return this.class.annotations[annotation];
  }

  /** @returns {import('../types').T_AnnotationItem} */
  getMethod(name) {
    return this.methods.find(v => v.name === name);
  }

  /**
   * @param {string} annotation 
   * @returns {import('../types').T_AnnotationItem[]}
   */
  getMethodsByAnnotation(annotation) {
    return this.methods.filter(v => v.annotations[annotation]);
  }

}