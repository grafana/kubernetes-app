'use strict';

System.register(['app/core/utils/kbn', 'lodash', 'moment'], function (_export, _context) {
  "use strict";

  var kbn, _, moment, _createClass, NodeStatsDatasource;

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
    setters: [function (_appCoreUtilsKbn) {
      kbn = _appCoreUtilsKbn.default;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_moment) {
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

      NodeStatsDatasource = function () {
        function NodeStatsDatasource(datasourceSrv, timeSrv) {
          _classCallCheck(this, NodeStatsDatasource);

          this.datasourceSrv = datasourceSrv;
          this.timeSrv = timeSrv;
        }

        _createClass(NodeStatsDatasource, [{
          key: 'issuePrometheusQuery',
          value: function issuePrometheusQuery(prometheusDS, query) {
            return this.datasourceSrv.get(prometheusDS).then(function (datasource) {
              var metricsQuery = {
                range: { from: moment().subtract(5, 'minute'), to: moment() },
                targets: [{ expr: query.expr, format: 'time_series' }],
                legendFormat: query.legend,
                interval: '60s'
              };
              return datasource.query(metricsQuery);
            }).then(function (result) {
              if (result && result.data) {
                return result.data;
              }
              return {};
            });
          }
        }, {
          key: 'getNodeStats',
          value: function getNodeStats(cluster_id, prometheusDS) {
            var _this = this;

            var podsPerNode = void 0,
                cpuPerNode = void 0,
                memoryPerNode = void 0;

            var podQuery = {
              expr: 'sum(label_join(kubelet_running_pod_count, "node",  "", "kubernetes_io_hostname")) by (node)',
              legend: "{{node}}"
            };
            var cpuQuery = {
              expr: 'sum(kube_pod_container_resource_requests_cpu_cores) by (node)',
              legend: "{{node}}"
            };
            var memoryQuery = {
              expr: 'sum(kube_pod_container_resource_requests_memory_bytes) by (node)',
              legend: "{{node}}"
            };

            return this.issuePrometheusQuery(prometheusDS, podQuery).then(function (data) {
              podsPerNode = data;
              return;
            }).then(function () {
              return _this.issuePrometheusQuery(prometheusDS, cpuQuery);
            }).then(function (data) {
              cpuPerNode = data;
              return;
            }).then(function () {
              return _this.issuePrometheusQuery(prometheusDS, memoryQuery);
            }).then(function (data) {
              memoryPerNode = data;
              return { podsPerNode: podsPerNode, cpuPerNode: cpuPerNode, memoryPerNode: memoryPerNode };
            });
          }
        }, {
          key: 'updateNodeWithStats',
          value: function updateNodeWithStats(node, nodeStats) {
            var formatFunc = kbn.valueFormats['percentunit'];
            var nodeName = slugify(node.metadata.name);
            var findFunction = function findFunction(o) {
              return o.target.substring(7, o.target.length - 2) === nodeName;
            };
            var podsUsedData = _.find(nodeStats.podsPerNode, findFunction);
            if (podsUsedData) {
              node.podsUsed = _.last(podsUsedData.datapoints)[0];
              node.podsUsedPerc = formatFunc(node.podsUsed / node.status.capacity.pods, 2, 5);
            }

            var cpuData = _.find(nodeStats.cpuPerNode, findFunction);
            if (cpuData) {
              node.cpuUsage = _.last(cpuData.datapoints)[0];
              node.cpuUsageFormatted = kbn.valueFormats['none'](node.cpuUsage, 2, null);
              node.cpuUsagePerc = formatFunc(node.cpuUsage / node.status.capacity.cpu, 2, 5);
            }

            var memData = _.find(nodeStats.memoryPerNode, findFunction);
            if (memData) {
              node.memoryUsage = _.last(memData.datapoints)[0];
              var memCapacity = node.status.capacity.memory.substring(0, node.status.capacity.memory.length - 2) * 1000;
              node.memUsageFormatted = kbn.valueFormats['bytes'](node.memoryUsage, 2, null);
              node.memCapacityFormatted = kbn.valueFormats['bytes'](memCapacity, 2, null);
              node.memoryUsagePerc = formatFunc(node.memoryUsage / memCapacity, 2, 5);
            }

            return node;
          }
        }]);

        return NodeStatsDatasource;
      }();

      _export('default', NodeStatsDatasource);
    }
  };
});
//# sourceMappingURL=nodeStats.js.map
