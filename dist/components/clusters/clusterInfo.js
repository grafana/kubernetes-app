'use strict';

System.register(['lodash', 'jquery'], function (_export, _context) {
  "use strict";

  var _, $, _createClass, ClusterInfoCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function slugify(str) {
    var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
    return slug;
  }

  function getComponentHealth(component) {
    var health = "unhealthy";
    var message = '';
    _.forEach(component.conditions, function (condition) {
      if (condition.type === "Healthy" && condition.status === "True") {
        health = "ok";
      } else {
        message = condition.message;
      }
    });
    return getHealthState(health, message);
  }

  function getNodeHealth(node) {
    var health = "unhealthy";
    var message = '';
    _.forEach(node.status.conditions, function (condition) {
      if (condition.type === "Ready" && condition.status === "True") {
        health = "ok";
      } else {
        message = condition.message;
      }
    });
    return getHealthState(health, message);
  }

  function getHealthState(health, message) {
    switch (health) {
      case 'ok':
        {
          return {
            text: 'OK',
            iconClass: 'icon-gf icon-gf-online',
            stateClass: 'alert-state-ok'
          };
        }
      case 'unhealthy':
        {
          return {
            text: 'UNHEALTHY',
            iconClass: 'icon-gf icon-gf-critical',
            stateClass: 'alert-state-critical',
            message: message || ''
          };
        }
      case 'warning':
        {
          return {
            text: 'warning',
            iconClass: "icon-gf icon-gf-critical",
            stateClass: 'alert-state-warning',
            message: message || ''
          };
        }
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_jquery) {
      $ = _jquery.default;
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
        function ClusterInfoCtrl($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, ClusterInfoCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.datasourceSrv = datasourceSrv;
          this.$location = $location;
          document.title = 'Grafana Kubernetes App';

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

          this.getCluster($location.search().cluster).then(function (clusterDS) {
            _this.clusterDS = clusterDS;
            _this.pageReady = true;
            _this.getClusterInfo();
          });
        }

        _createClass(ClusterInfoCtrl, [{
          key: 'getCluster',
          value: function getCluster(id) {
            var _this2 = this;

            return this.backendSrv.get('api/datasources/' + id).then(function (ds) {
              _this2.cluster = ds;
              return _this2.datasourceSrv.get(ds.name);
            });
          }
        }, {
          key: 'getClusterInfo',
          value: function getClusterInfo() {
            var _this3 = this;

            this.clusterDS.getComponentStatuses().then(function (stats) {
              _this3.componentStatuses = _.map(stats, function (stat) {
                stat.healthState = getComponentHealth(stat);
                return stat;
              });
            });
            this.clusterDS.getNamespaces().then(function (namespaces) {
              _this3.namespaces = namespaces;
            });
            this.clusterDS.getNodes().then(function (nodes) {
              _this3.nodes = _.map(nodes, function (node) {
                node.healthState = getNodeHealth(node);
                return node;
              });
            });
          }
        }, {
          key: 'goToClusterDashboard',
          value: function goToClusterDashboard() {
            this.$location.path("dashboard/db/kubernetes-cluster").search({
              "var-datasource": this.cluster.jsonData.ds,
              "var-cluster": this.cluster.name
            });
          }
        }, {
          key: 'goToPodDashboard',
          value: function goToPodDashboard() {
            this.$location.path("dashboard/db/kubernetes-container").search({
              "var-datasource": this.cluster.jsonData.ds,
              "var-cluster": this.cluster.name,
              "var-node": 'All',
              "var-namespace": 'All',
              "var-pod": 'All'
            });
          }
        }, {
          key: 'goToNodeDashboard',
          value: function goToNodeDashboard(node, evt) {
            var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
            if (clickTargetIsLinkOrHasLinkParents === false) {
              this.$location.path("dashboard/db/kubernetes-node").search({
                "var-datasource": this.cluster.jsonData.ds,
                "var-cluster": this.cluster.name,
                "var-node": node === 'All' ? 'All' : slugify(node.metadata.name)
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
                "node": node.metadata.name
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
