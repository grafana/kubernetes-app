'use strict';

System.register(['lodash', 'app/core/app_events'], function (_export, _context) {
  "use strict";

  var _, appEvents, _createClass, ClustersCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreApp_events) {
      appEvents = _appCoreApp_events.default;
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

      _export('ClustersCtrl', ClustersCtrl = function () {
        /** @ngInject */
        function ClustersCtrl($scope, $injector, backendSrv, contextSrv, $location) {
          _classCallCheck(this, ClustersCtrl);

          var self = this;
          this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
          this.backendSrv = backendSrv;
          this.$location = $location;
          document.title = 'Grafana Kubernetes App';
          this.clusters = {};
          this.pageReady = false;
          this.getClusters().then(function () {
            self.pageReady = true;
          });
        }

        _createClass(ClustersCtrl, [{
          key: 'getClusters',
          value: function getClusters() {
            var self = this;
            return this.backendSrv.get('/api/datasources').then(function (result) {
              self.clusters = _.filter(result, { "type": "raintank-kubernetes-datasource" });
            });
          }
        }, {
          key: 'confirmDelete',
          value: function confirmDelete(id) {
            var _this = this;

            this.backendSrv.delete('/api/datasources/' + id).then(function () {
              _this.getClusters();
            });
          }
        }, {
          key: 'deleteCluster',
          value: function deleteCluster(cluster) {
            var _this2 = this;

            appEvents.emit('confirm-modal', {
              title: 'Delete',
              text: 'Are you sure you want to delete this data source? ' + 'If you need to undeploy the collectors, then do that before deleting the data source.',
              yesText: "Delete",
              icon: "fa-trash",
              onConfirm: function onConfirm() {
                _this2.confirmDelete(cluster.id);
              }
            });
          }
        }, {
          key: 'clusterInfo',
          value: function clusterInfo(cluster) {
            this.$location.path("plugins/raintank-kubernetes-app/page/cluster-info").search({ "cluster": cluster.id });
          }
        }]);

        return ClustersCtrl;
      }());

      _export('ClustersCtrl', ClustersCtrl);

      ClustersCtrl.templateUrl = 'components/clusters/partials/clusters.html';
    }
  };
});
//# sourceMappingURL=clusters.js.map
