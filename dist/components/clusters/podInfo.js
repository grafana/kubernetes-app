"use strict";

System.register([], function (_export, _context) {
  "use strict";

  var _createClass, PodInfoCtrl;

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

      _export("PodInfoCtrl", PodInfoCtrl = function () {
        /** @ngInject */
        function PodInfoCtrl($scope, $injector, backendSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, PodInfoCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.$location = $location;
          this.pageReady = false;
          this.pod = {};
          if (!("cluster" in $location.search() && "namespace" in $location.search())) {
            alertSrv.set("no cluster or namespace specified.", "no cluster or namespace specified in url", 'error');
            return;
          } else {
            this.cluster_id = $location.search().cluster;
            this.namespace = $location.search().namespace;
          }

          this.getPod($location.search().namespace, $location.search().pod).then(function () {
            _this.pageReady = true;
          });
        }

        _createClass(PodInfoCtrl, [{
          key: "k8sApiRequest_GET",
          value: function k8sApiRequest_GET(api_resource) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + this.cluster_id + '/api/v1/' + api_resource,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: "getPod",
          value: function getPod(namespace, name) {
            var _this2 = this;

            return this.k8sApiRequest_GET('namespaces/' + namespace + '/pods/' + name).then(function (pod) {
              _this2.pod = pod;
            });
          }
        }, {
          key: "conditionStatus",
          value: function conditionStatus(condition) {
            var status;
            if (condition.type === "Ready") {
              status = condition.status === "True";
            } else {
              status = condition.status === "False";
            }

            return {
              value: status,
              text: status ? "Ok" : "Error"
            };
          }
        }]);

        return PodInfoCtrl;
      }());

      _export("PodInfoCtrl", PodInfoCtrl);

      PodInfoCtrl.templateUrl = 'components/clusters/pod_info.html';
    }
  };
});
//# sourceMappingURL=podInfo.js.map
