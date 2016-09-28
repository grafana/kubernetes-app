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
    var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
    return slug;
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
        function ClusterInfoCtrl($scope, $injector, backendSrv, $q, $location, alertSrv) {
          _classCallCheck(this, ClusterInfoCtrl);

          var self = this;
          this.$q = $q;
          this.backendSrv = backendSrv;
          this.$location = $location;
          this.pageReady = false;
          this.cluster = {};
          this.componentStatuses = [];
          this.namespaces = [];
          this.namespace = "";
          this.nodes = [];
          this.daemonSets = [];
          this.replicationControllers = [];
          this.deployments = [];
          this.pods = [];
          if (!("cluster" in $location.search())) {
            alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
            return;
          }

          self.getCluster($location.search().cluster).then(function () {
            self.pageReady = true;
            self.getWorkloads();
          });
        }

        _createClass(ClusterInfoCtrl, [{
          key: 'getWorkloads',
          value: function getWorkloads() {
            var self = this;
            this.getComponentStatuses().then(function (stats) {
              self.componentStatuses = stats.items;
            });
            this.getNamespaces().then(function (ns) {
              self.namespaces = ns.items;
            });
            this.getNodes().then(function (nodes) {
              self.nodes = nodes.items;
            });
            this.getDaemonSets().then(function (ds) {
              self.daemonSets = ds.items;
            });
            this.getReplicationControllers().then(function (rc) {
              self.replicationControllers = rc.items;
            });
            this.getDeployments().then(function (deploy) {
              self.deployments = deploy.items;
            });
            this.getPods().then(function (pod) {
              self.pods = pod.items;
            });
          }
        }, {
          key: 'getCluster',
          value: function getCluster(id) {
            var self = this;
            return this.backendSrv.get('api/datasources/' + id).then(function (ds) {
              self.cluster = ds;
            });
          }
        }, {
          key: 'getComponentStatuses',
          value: function getComponentStatuses() {
            var self = this;
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/componentstatuses',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
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
          key: 'getNamespaces',
          value: function getNamespaces() {
            var self = this;
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: 'getNodes',
          value: function getNodes() {
            var self = this;
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/nodes',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
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
          key: 'nodeDashboard',
          value: function nodeDashboard(node, evt) {
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
          key: 'getResource',
          value: function getResource(prefix, resource) {
            var self = this;
            if (this.namespace) {
              resource = "namespaces/" + this.namespace + "/" + resource;
            }

            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + prefix + resource,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: 'getDaemonSets',
          value: function getDaemonSets() {
            return this.getResource("/apis/extensions/v1beta1/", "daemonsets");
          }
        }, {
          key: 'getReplicationControllers',
          value: function getReplicationControllers() {
            return this.getResource("/api/v1/", "replicationcontrollers");
          }
        }, {
          key: 'getDeployments',
          value: function getDeployments() {
            return this.getResource("/apis/extensions/v1beta1/", "deployments");
          }
        }, {
          key: 'getPods',
          value: function getPods() {
            return this.getResource("/api/v1/", "pods");
          }
        }]);

        return ClusterInfoCtrl;
      }());

      _export('ClusterInfoCtrl', ClusterInfoCtrl);

      ClusterInfoCtrl.templateUrl = 'components/clusters/cluster_info.html';
    }
  };
});
//# sourceMappingURL=clusterInfo.js.map
