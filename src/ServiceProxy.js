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