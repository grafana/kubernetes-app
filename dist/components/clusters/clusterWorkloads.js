'use strict';

System.register(['lodash', 'jquery', './k8sClusterAPI'], function (_export, _context) {
  "use strict";

  var _, $, K8sClusterAPI, _createClass, ClusterWorkloadsCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function slugify(str) {
    var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
    return slug;
  }

  function extractContainerID(str) {
    var dockerIDPattern = /docker\:\/\/(.{12})/;
    return dockerIDPattern.exec(str)[1];
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

      _export('ClusterWorkloadsCtrl', ClusterWorkloadsCtrl = function () {
        /** @ngInject */
        function ClusterWorkloadsCtrl($scope, $injector, backendSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, ClusterWorkloadsCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.$location = $location;

          this.pageReady = false;
          this.cluster = {};
          this.namespaces = [];
          this.namespace = "";
          this.daemonSets = [];
          this.replicationControllers = [];
          this.deployments = [];
          this.pods = [];

          if (!("cluster" in $location.search())) {
            alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
            return;
          }

          if ("namespace" in $location.search()) {
            this.namespace = $location.search().namespace;
          }

          this.getCluster($location.search().cluster).then(function () {
            _this.clusterAPI = new K8sClusterAPI(_this.cluster.id, backendSrv);
            _this.pageReady = true;
            _this.getWorkloads();
          });
        }

        _createClass(ClusterWorkloadsCtrl, [{
          key: 'getWorkloads',
          value: function getWorkloads() {
            var _this2 = this;

            this.clusterAPI.get('namespaces').then(function (ns) {
              _this2.namespaces = ns.items;
            });
            this.getDaemonSets().then(function (ds) {
              _this2.daemonSets = ds.items;
            });
            this.getReplicationControllers().then(function (rc) {
              _this2.replicationControllers = rc.items;
            });
            this.getDeployments().then(function (deploy) {
              _this2.deployments = deploy.items;
            });
            this.getPods().then(function (pod) {
              _this2.pods = pod.items;
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
          key: 'goToPodDashboard',
          value: function goToPodDashboard(pod, evt) {
            var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
            if (clickTargetIsLinkOrHasLinkParents === false) {
              var containerIDs = _.map(pod.status.containerStatuses, function (status) {
                return extractContainerID(status.containerID);
              });
              this.$location.path("dashboard/db/kubernetes-container").search({
                "var-datasource": this.cluster.jsonData.ds,
                "var-cluster": this.cluster.name,
                "var-node": slugify(pod.spec.nodeName),
                "var-container": containerIDs
              });
            }
          }
        }, {
          key: 'goToPodInfo',
          value: function goToPodInfo(pod, evt) {
            var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;

            var closestElm = _.head($(evt.target).closest('div'));
            var clickTargetClickAttr = _.find(closestElm.attributes, { name: "ng-click" });
            var clickTargetIsNodeDashboard = clickTargetClickAttr ? clickTargetClickAttr.value === "ctrl.goToPodDashboard(pod, $event)" : false;
            if (clickTargetIsLinkOrHasLinkParents === false && clickTargetIsNodeDashboard === false) {
              this.$location.path("plugins/raintank-kubernetes-app/page/pod-info").search({
                "cluster": this.cluster.id,
                "namespace": slugify(pod.metadata.namespace),
                "pod": slugify(pod.metadata.name)
              });
            }
          }
        }, {
          key: 'getResource',
          value: function getResource(prefix, resource) {
            if (this.namespace) {
              resource = "namespaces/" + this.namespace + "/" + resource;
            }

            return this.clusterAPI.getRawResource(prefix + resource);
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

        return ClusterWorkloadsCtrl;
      }());

      _export('ClusterWorkloadsCtrl', ClusterWorkloadsCtrl);

      ClusterWorkloadsCtrl.templateUrl = 'components/clusters/partials/cluster_workloads.html';
    }
  };
});
//# sourceMappingURL=clusterWorkloads.js.map
