"use strict";

System.register(["moment"], function (_export, _context) {
  "use strict";

  var moment, _createClass, PodInfoCtrl;

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

      _export("PodInfoCtrl", PodInfoCtrl = function () {
        /** @ngInject */
        function PodInfoCtrl($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
          var _this = this;

          _classCallCheck(this, PodInfoCtrl);

          this.$q = $q;
          this.backendSrv = backendSrv;
          this.datasourceSrv = datasourceSrv;
          this.$location = $location;
          document.title = 'Grafana Kubernetes App';

          this.pageReady = false;
          this.pod = {};
          if (!("cluster" in $location.search())) {
            alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
            return;
          } else {
            (function () {
              _this.cluster_id = $location.search().cluster;
              var pod_name = $location.search().pod;

              _this.loadDatasource(_this.cluster_id).then(function () {
                _this.clusterDS.getPod(pod_name).then(function (pod) {
                  _this.pod = pod;
                  _this.pageReady = true;
                });
              });
            })();
          }
        }

        _createClass(PodInfoCtrl, [{
          key: "loadDatasource",
          value: function loadDatasource(id) {
            var _this2 = this;

            return this.backendSrv.get('api/datasources/' + id).then(function (ds) {
              _this2.datasource = ds.jsonData.ds;
              return _this2.datasourceSrv.get(ds.name);
            }).then(function (clusterDS) {
              _this2.clusterDS = clusterDS;
              return clusterDS;
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
          key: "goToPodDashboard",
          value: function goToPodDashboard(pod) {
            this.$location.path("dashboard/db/kubernetes-container").search({
              "var-datasource": this.datasource,
              "var-cluster": this.clusterDS.name,
              "var-node": slugify(pod.spec.nodeName),
              "var-namespace": pod.metadata.namespace,
              "var-pod": pod.metadata.name
            });
          }
        }, {
          key: "isConditionOk",
          value: function isConditionOk(condition) {
            return this.conditionStatus(condition).value;
          }
        }, {
          key: "formatTime",
          value: function formatTime(time) {
            return moment(time).format('YYYY-MM-DD HH:mm:ss');
          }
        }]);

        return PodInfoCtrl;
      }());

      _export("PodInfoCtrl", PodInfoCtrl);

      PodInfoCtrl.templateUrl = 'components/clusters/partials/pod_info.html';
    }
  };
});
//# sourceMappingURL=podInfo.js.map
