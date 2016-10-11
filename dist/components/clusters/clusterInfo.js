'use strict';

System.register(['lodash', 'jquery', './k8sClusterAPI'], function (_export, _context) {
  "use strict";

  var _, $, K8sClusterAPI, _createClass, ClusterInfoCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function slugify(str) {
    var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
    return slug;
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
    }, function (_k8sClusterAPI) {
      K8sClusterAPI = _k8sClusterAPI.K8sClusterAPI;
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

      _export('ClusterInfoCtrl', ClusterInfoCtrl = function () {
        /** @ngInject */
        function ClusterInfoCtrl($scope, $injector, backendSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, ClusterInfoCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.$location = $location;
          this.clusterAPI = {};

          this.pageReady = false;
          this.cluster = {};
          this.componentStatuses = [];
          this.namespaces = [];
          this.namespace = "";
          this.nodes = [];

          if (!("cluster" in $location.search())) {
            alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
            return;
          }

          this.getCluster($location.search().cluster).then(function () {
            _this.clusterAPI = new K8sClusterAPI(_this.cluster.id, backendSrv);
            _this.pageReady = true;
            _this.getWorkloads();
          });
        }

        _createClass(ClusterInfoCtrl, [{
          key: 'getWorkloads',
          value: function getWorkloads() {
            var _this2 = this;

            this.clusterAPI.get('componentstatuses').then(function (stats) {
              _this2.componentStatuses = stats.items;
            });
            this.clusterAPI.get('namespaces').then(function (ns) {
              _this2.namespaces = ns.items;
            });
            this.clusterAPI.get('nodes').then(function (nodes) {
              _this2.nodes = nodes.items;
            });
          }
        }, {
          key: 'getCluster',
          value: function getCluster(id) {
            var _this3 = this;

            return this.backendSrv.get('api/datasources/' + id).then(function (ds) {
              _this3.cluster = ds;
            });
          }
        }, {
          key: 'componentHealth',
          value: function componentHealth(component) {
            var health = "unhealthy";
            _.forEach(component.conditions, function (condition) {
              if (condition.type === "Healthy" && condition.status === "True") {
                health = "healthy";
              }
            });
            return health;
          }
        }, {
          key: 'isComponentHealthy',
          value: function isComponentHealthy(component) {
            return this.componentHealth(component) === "healthy";
          }
        }, {
          key: 'nodeStatus',
          value: function nodeStatus(node) {
            var health = "unhealthy";
            _.forEach(node.status.conditions, function (condition) {
              if (condition.type === "Ready" && condition.status === "True") {
                health = "healthy";
              }
            });
            return health;
          }
        }, {
          key: 'isNodeHealthy',
          value: function isNodeHealthy(node) {
            return this.nodeStatus(node) === "healthy";
          }
        }, {
          key: 'goToNodeDashboard',
          value: function goToNodeDashboard(node, evt) {
            var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
            if (clickTargetIsLinkOrHasLinkParents === false) {
              this.$location.path("dashboard/db/kubernetes-node").search({
                "var-datasource": this.cluster.jsonData.ds,
                "var-cluster": this.cluster.name,
                "var-node": slugify(node.metadata.name)
              });
            }
          }
        }, {
          key: 'goToWorkloads',
          value: function goToWorkloads(ns, evt) {
            var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
            if (clickTargetIsLinkOrHasLinkParents === false) {
              this.$location.path("plugins/raintank-kubernetes-app/page/cluster-workloads").search({
                "cluster": this.cluster.id,
                "namespace": slugify(ns.metadata.name)
              });
            }
          }
        }, {
          key: 'goToNodeInfo',
          value: function goToNodeInfo(node, evt) {
            var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;

            var closestElm = _.head($(evt.target).closest('div'));
            var clickTargetClickAttr = _.find(closestElm.attributes, { name: "ng-click" });
            var clickTargetIsNodeDashboard = clickTargetClickAttr ? clickTargetClickAttr.value === "ctrl.goToNodeDashboard(node, $event)" : false;
            if (clickTargetIsLinkOrHasLinkParents === false && clickTargetIsNodeDashboard === false) {
              this.$location.path("plugins/raintank-kubernetes-app/page/node-info").search({
                "cluster": this.cluster.id,
                "node": slugify(node.metadata.name)
              });
            }
          }
        }]);

        return ClusterInfoCtrl;
      }());

      _export('ClusterInfoCtrl', ClusterInfoCtrl);

      ClusterInfoCtrl.templateUrl = 'components/clusters/partials/cluster_info.html';
    }
  };
});
//# sourceMappingURL=clusterInfo.js.map
