import kbn from 'app/core/utils/kbn';
import _ from 'lodash';

export default class NodeStatsDatasource {
  constructor(datasourceSrv, timeSrv) {
    this.datasourceSrv = datasourceSrv;
    this.timeSrv = timeSrv;
  }

  issueGraphiteQuery(graphiteDs, query) {
    return this.datasourceSrv.get(graphiteDs)
      .then((datasource) => {
        var metricsQuery = {
          range: this.timeSrv.timeRange(),
          rangeRaw: this.timeSrv.timeRange().raw,
          interval: this.interval,
          intervalMs: this.intervalMs,
          targets: [
            {
              refId: 'A',
              target: query
            }
          ],
          format: 'json',
          maxDataPoints: 1000,
        };

        return datasource.query(metricsQuery);
      }).then((result) => {
        if (result && result.data) {
          return result.data;
        }

        return {};
      });
  }

  getNodeStats(cluster_id, graphiteDs) {
    let podsPerNode, cpuPerNode, memoryPerNode;

    const podQuery = 'aliasByNode(keepLastValue(groupByNode(snap.' + cluster_id
      + ".grafanalabs.kubestate.pod.*.*.*.status.phase.Running, 6, 'sum'), 100), 0)";
    const cpuQuery = 'aliasByNode(keepLastValue(groupByNode(snap.' + cluster_id
      + ".grafanalabs.kubestate.container.*.*.*.*.requested.cpu.cores, 6, 'sum'), 100), 0)";
    const memoryQuery = 'aliasByNode(keepLastValue(groupByNode(snap.' + cluster_id
      + ".grafanalabs.kubestate.container.*.*.*.*.requested.memory.bytes, 6, 'sum'), 100), 0)";

    return this.issueGraphiteQuery(graphiteDs, podQuery)
      .then(data => {
        podsPerNode = data;
        return;
      }).then(() => {
        return this.issueGraphiteQuery(graphiteDs, cpuQuery);
      })
      .then(data => {
        cpuPerNode = data;
        return;
      }).then(() => {
        return this.issueGraphiteQuery(graphiteDs, memoryQuery);
      })
      .then(data => {
        memoryPerNode = data;
        return {podsPerNode, cpuPerNode, memoryPerNode};
      });
  }

  updateNodeWithStats(node, nodeStats) {
    var formatFunc = kbn.valueFormats['percentunit'];
    const nodeName = slugify(node.metadata.name);
    const podsUsedData = _.find(nodeStats.podsPerNode, {'target': nodeName});
    if (podsUsedData) {
      node.podsUsed = _.last(podsUsedData.datapoints)[0];
      node.podsUsedPerc = formatFunc(node.podsUsed / node.status.capacity.pods, 2, 5);
    }

    const cpuData = _.find(nodeStats.cpuPerNode, {'target': nodeName});
    if (cpuData) {
      node.cpuUsage = _.last(cpuData.datapoints)[0];
      node.cpuUsageFormatted = kbn.valueFormats['none'](node.cpuUsage, 2, null);
      node.cpuUsagePerc = formatFunc(node.cpuUsage / node.status.capacity.cpu, 2, 5);
    }

    const memData = _.find(nodeStats.memoryPerNode, {'target': nodeName});
    if (memData) {
      node.memoryUsage = _.last(memData.datapoints)[0];
      const memCapacity = node.status.capacity.memory.substring(0, node.status.capacity.memory.length - 2)  * 1000;
      node.memUsageFormatted = kbn.valueFormats['bytes'](node.memoryUsage, 2, null);
      node.memCapacityFormatted = kbn.valueFormats['bytes'](memCapacity, 2, null);
      node.memoryUsagePerc = formatFunc((node.memoryUsage / memCapacity), 2, 5);
    }

    return node;
  }
}

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
  return slug;
}
