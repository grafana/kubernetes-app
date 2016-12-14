'use strict';

System.register(['lodash', 'jquery'], function (_export, _context) {
  "use strict";

  var _, $, _createClass, ClusterWorkloadsCtrl;

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

      _export('ClusterWorkloadsCtrl', ClusterWorkloadsCtrl = function () {
        /** @ngInject */
        function ClusterWorkloadsCtrl($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, ClusterWorkloadsCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.datasourceSrv = datasourceSrv;
          this.$location = $location;
          document.title = 'Grafana Kubernetes App';

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

          this.getCluster($location.search().cluster).then(function (clusterDS) {
            _this.clusterDS = clusterDS;
            _this.pageReady = true;
            _this.getWorkloads();
          });
        }

        _createClass(ClusterWorkloadsCtrl, [{
          key: 'getCluster',
          value: function getCluster(id) {
            var _this2 = this;

            return this.backendSrv.get('api/datasources/' + id).then(function (ds) {
              _this2.cluster = ds;
              return _this2.datasourceSrv.get(ds.name);
            });
          }
        }, {
          key: 'getWorkloads',
          value: function getWorkloads() {
            var _this3 = this;

            var namespace = this.namespace;
            this.clusterDS.getNamespaces().then(function (namespaces) {
              _this3.namespaces = namespaces;
            });
            this.clusterDS.getDaemonSets(namespace).then(function (daemonSets) {
              _this3.daemonSets = daemonSets;
            });
            this.clusterDS.getReplicationControllers(namespace).then(function (rc) {
              _this3.replicationControllers = rc;
            });
            this.clusterDS.getDeployments(namespace).then(function (deployments) {
              _this3.deployments = deployments;
            });
            this.clusterDS.getPods(namespace).then(function (pods) {
              _this3.pods = pods;
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
          value: function goToPodDashboard(pod) {
            this.$location.path("dashboard/db/kubernetes-container").search({
              "var-datasource": this.cluster.jsonData.ds,
              "var-cluster": this.cluster.name,
              "var-node": slugify(pod.spec.nodeName),
              "var-namespace": pod.metadata.namespace,
              "var-pod": pod.metadata.name
            });
          }
        }, {
          key: 'goToDeploymentDashboard',
          value: function goToDeploymentDashboard(deploy) {
            this.$location.path("dashboard/db/kubernetes-deployments").search({
              "var-datasource": this.cluster.jsonData.ds,
              "var-cluster": this.cluster.name,
              "var-namespace": deploy.metadata.namespace,
              "var-deployment": deploy.metadata.name
            });
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
                "pod": pod.metadata.name
              });
            }
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
