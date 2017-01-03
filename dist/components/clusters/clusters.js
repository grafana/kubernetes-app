'use strict';

System.register(['lodash', 'jquery'], function (_export, _context) {
  "use strict";

  var _, $, _createClass, ClustersCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
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
          key: 'clusterInfo',
          value: function clusterInfo(cluster, evt) {
            var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
            if (clickTargetIsLinkOrHasLinkParents === false) {
              this.$location.path("plugins/raintank-kubernetes-app/page/cluster-info").search({ "cluster": cluster.id });
            }
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
