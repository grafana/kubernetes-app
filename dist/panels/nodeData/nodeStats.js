'use strict';

System.register(['app/core/utils/kbn', 'lodash'], function (_export, _context) {
  "use strict";

  var kbn, _, _createClass, NodeStatsDatasource;

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
          key: 'issueGraphiteQuery',
          value: function issueGraphiteQuery(graphiteDs, query) {
            var _this = this;

            return this.datasourceSrv.get(graphiteDs).then(function (datasource) {
              var metricsQuery = {
                range: _this.timeSrv.timeRange(),
                rangeRaw: _this.timeSrv.timeRange().raw,
                interval: _this.interval,
                intervalMs: _this.intervalMs,
                targets: [{
                  refId: 'A',
                  target: query
                }],
                format: 'json',
                maxDataPoints: 1000
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
          value: function getNodeStats(cluster_id, graphiteDs) {
            var _this2 = this;

            var podsPerNode = void 0,
                cpuPerNode = void 0,
                memoryPerNode = void 0;

            var podQuery = 'aliasByNode(keepLastValue(groupByNode(snap.' + cluster_id + ".grafanalabs.kubestate.pod.*.*.*.status.phase.Running, 6, 'sum'), 100), 0)";
            var cpuQuery = 'aliasByNode(keepLastValue(groupByNode(snap.' + cluster_id + ".grafanalabs.kubestate.container.*.*.*.*.requested.cpu.cores, 6, 'sum'), 100), 0)";
            var memoryQuery = 'aliasByNode(keepLastValue(groupByNode(snap.' + cluster_id + ".grafanalabs.kubestate.container.*.*.*.*.requested.memory.bytes, 6, 'sum'), 100), 0)";

            return this.issueGraphiteQuery(graphiteDs, podQuery).then(function (data) {
              podsPerNode = data;
              return;
            }).then(function () {
              return _this2.issueGraphiteQuery(graphiteDs, cpuQuery);
            }).then(function (data) {
              cpuPerNode = data;
              return;
            }).then(function () {
              return _this2.issueGraphiteQuery(graphiteDs, memoryQuery);
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
            var podsUsedData = _.find(nodeStats.podsPerNode, { 'target': nodeName });
            if (podsUsedData) {
              node.podsUsed = _.last(podsUsedData.datapoints)[0];
              node.podsUsedPerc = formatFunc(node.podsUsed / node.status.capacity.pods, 2, 5);
            }

            var cpuData = _.find(nodeStats.cpuPerNode, { 'target': nodeName });
            if (cpuData) {
              node.cpuUsage = _.last(cpuData.datapoints)[0];
              node.cpuUsageFormatted = kbn.valueFormats['none'](node.cpuUsage, 2, null);
              node.cpuUsagePerc = formatFunc(node.cpuUsage / node.status.capacity.cpu, 2, 5);
            }

            var memData = _.find(nodeStats.memoryPerNode, { 'target': nodeName });
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
