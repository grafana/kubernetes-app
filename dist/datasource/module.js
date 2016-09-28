'use strict';

System.register(['./datasource'], function (_export, _context) {
  "use strict";

  var K8sDatasource, K8sConfigCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_datasource) {
      K8sDatasource = _datasource.K8sDatasource;
    }],
    execute: function () {
      _export('ConfigCtrl', K8sConfigCtrl = function K8sConfigCtrl() {
        _classCallCheck(this, K8sConfigCtrl);
      });

      K8sConfigCtrl.templateUrl = 'datasource/config.html';

      _export('Datasource', K8sDatasource);

      _export('ConfigCtrl', K8sConfigCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
