'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var _createClass, K8sClusterAPI;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('K8sClusterAPI', K8sClusterAPI = function () {
        /** @ngInject */
        function K8sClusterAPI(clusterID, backendSrv) {
          _classCallCheck(this, K8sClusterAPI);

          this.cluster_id = clusterID;
          this.backendSrv = backendSrv;
          this.baseUrl = 'api/datasources/proxy/' + this.cluster_id;
          this.baseApiUrl = this.baseUrl + '/api/v1/';
        }

        _createClass(K8sClusterAPI, [{
          key: 'get',
          value: function get(apiResource) {
            return this.backendSrv.get(this.baseApiUrl + apiResource);
          }
        }, {
          key: 'getRawResource',
          value: function getRawResource(rawApiResourceUrl) {
            return this.backendSrv.get(this.baseUrl + rawApiResourceUrl);
          }
        }]);

        return K8sClusterAPI;
      }());

      _export('K8sClusterAPI', K8sClusterAPI);
    }
  };
});
//# sourceMappingURL=k8sClusterAPI.js.map
