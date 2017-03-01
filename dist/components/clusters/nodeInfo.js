'use strict';

System.register(['moment'], function (_export, _context) {
  "use strict";

  var moment, _createClass, NodeInfoCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function slugify(str) {
    var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
    return slug;
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

      _export('NodeInfoCtrl', NodeInfoCtrl = function () {
        /** @ngInject */
        function NodeInfoCtrl($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, NodeInfoCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.datasourceSrv = datasourceSrv;
          this.$location = $location;
          document.title = 'Grafana Kubernetes App';

          this.pageReady = false;
          this.cluster = {};
          this.clusterDS = {};
          this.node = {};

          if (!("cluster" in $location.search())) {
            alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
            return;
          } else {
            (function () {
              var cluster_id = $location.search().cluster;
              var node_name = $location.search().node;

              _this.loadDatasource(cluster_id).then(function () {
                _this.clusterDS.getNode(node_name).then(function (node) {
                  _this.node = node;
                  _this.pageReady = true;
                });
              });
            })();
          }
        }

        _createClass(NodeInfoCtrl, [{
          key: 'loadDatasource',
          value: function loadDatasource(id) {
            var _this2 = this;

            return this.backendSrv.get('api/datasources/' + id).then(function (ds) {
              _this2.cluster = ds;
              return _this2.datasourceSrv.get(ds.name);
            }).then(function (clusterDS) {
              _this2.clusterDS = clusterDS;
              return clusterDS;
            });
          }
        }, {
          key: 'goToNodeDashboard',
          value: function goToNodeDashboard() {
            this.$location.path("dashboard/db/kubernetes-node").search({
              "var-datasource": this.cluster.jsonData.ds,
              "var-cluster": this.cluster.name,
              "var-node": slugify(this.node.metadata.name)
            });
          }
        }, {
          key: 'conditionStatus',
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
          key: 'isConditionOk',
          value: function isConditionOk(condition) {
            return this.conditionStatus(condition).value;
          }
        }, {
          key: 'conditionLastTransitionTime',
          value: function conditionLastTransitionTime(condition) {
            return moment(condition.lastTransitionTime).format('YYYY-MM-DD HH:mm:ss');
          }
        }]);

        return NodeInfoCtrl;
      }());

      _export('NodeInfoCtrl', NodeInfoCtrl);

      NodeInfoCtrl.templateUrl = 'components/clusters/partials/node_info.html';
    }
  };
});
//# sourceMappingURL=nodeInfo.js.map
