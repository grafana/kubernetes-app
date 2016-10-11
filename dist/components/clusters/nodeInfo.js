"use strict";

System.register(["moment"], function (_export, _context) {
  "use strict";

  var moment, _createClass, NodeInfoCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_moment) {
      moment = _moment.default;
    }],
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

      _export("NodeInfoCtrl", NodeInfoCtrl = function () {
        /** @ngInject */
        function NodeInfoCtrl($scope, $injector, backendSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, NodeInfoCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.$location = $location;
          this.pageReady = false;
          this.node = {};
          if (!("cluster" in $location.search())) {
            alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
            return;
          } else {
            this.cluster_id = $location.search().cluster;
          }

          this.getNode($location.search().node).then(function () {
            _this.pageReady = true;
          });
        }

        _createClass(NodeInfoCtrl, [{
          key: "k8sApiRequest_GET",
          value: function k8sApiRequest_GET(api_resource) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + this.cluster_id + '/api/v1/' + api_resource,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: "getNode",
          value: function getNode(name) {
            var _this2 = this;

            return this.k8sApiRequest_GET('nodes/' + name).then(function (node) {
              _this2.node = node;
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
        }, {
          key: "isConditionOk",
          value: function isConditionOk(condition) {
            return this.conditionStatus(condition).value;
          }
        }, {
          key: "conditionLastTransitionTime",
          value: function conditionLastTransitionTime(condition) {
            return moment(condition.lastTransitionTime).format('YYYY-MM-DD HH:mm:ss');
          }
        }]);

        return NodeInfoCtrl;
      }());

      _export("NodeInfoCtrl", NodeInfoCtrl);

      NodeInfoCtrl.templateUrl = 'components/clusters/partials/node_info.html';
    }
  };
});
//# sourceMappingURL=nodeInfo.js.map
