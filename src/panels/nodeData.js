import moment from 'moment';
import {PanelCtrl} from 'app/plugins/sdk';
import _ from 'lodash';
import NodeStatsDatasource from './nodeStats';

const panelDefaults = {
};

export class NodeDataCtrl extends PanelCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv, timeSrv, $window) {
    super($scope, $injector);
    _.defaults(this.panel, panelDefaults);

    this.$q = $q;
    this.backendSrv = backendSrv;
    this.datasourceSrv = datasourceSrv;
    this.$location = $location;
    this.alertSrv = alertSrv;
    this.timeSrv = timeSrv;
    this.$window = $window;
    this.nodeStatsDatasource = new NodeStatsDatasource(datasourceSrv, timeSrv);
    document.title = 'Grafana Kubernetes App';

    this.pageReady = false;
    this.cluster = {};
    this.clusterDS = {};
    this.node = {};

    this.isInListMode = false;
    this.nodes = [];

    this.loadCluster();
  }

  loadCluster() {
    if (!("var-cluster" in this.$location.search())) {
      this.alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      const cluster_id = this.$location.search()['var-cluster'];
      const node_name  = this.$location.search()['var-node'];
      const graphiteDs  = this.$location.search()['var-datasource'];

      this.loadDatasource(cluster_id).then(() => {
        return this.nodeStatsDatasource.getNodeStats(cluster_id, graphiteDs);
      }).then(nodeStats => {
        if (node_name === 'All') {
          this.isInListMode = true;
          this.clusterDS.getNodes().then(nodes => {
            this.nodes = _.map(nodes, node => {
              node.healthState = this.getNodeHealth(node);
              this.nodeStatsDatasource.updateNodeWithStats(node, nodeStats);

              return node;
            });
          });
        } else {
          this.isInListMode = false;
          this.clusterDS.getNode(node_name).then(node => {
            this.node = node;
            this.pageReady = true;
          });
        }
      });
    }
  }

  getNodeHealth(node) {
    let health = "unhealthy";
    let message = '';
    _.forEach(node.status.conditions, condition => {
      if (condition.type   === "Ready" &&
          condition.status === "True") {
        health = "ok";
      } else {
        message = condition.message;
      }
    });
    return this.getHealthState(health, message);
  }

  getHealthState(health, message) {
    switch (health) {
      case 'ok': {
        return {
          text: 'OK',
          iconClass: 'icon-gf icon-gf-online',
          stateClass: 'alert-state-ok'
        };
      }
      case 'unhealthy': {
        return {
          text: 'UNHEALTHY',
          iconClass: 'icon-gf icon-gf-critical',
          stateClass: 'alert-state-critical',
          message: message || ''
        };
      }
      case 'warning': {
        return {
          text: 'warning',
          iconClass: "icon-gf icon-gf-critical",
          stateClass: 'alert-state-warning',
          message: message || ''
        };
      }
    }
  }

  refresh() {
    this.loadCluster();
  }

  loadDatasource(id) {
    return this.backendSrv.get('api/datasources')
      .then(result => {
        return _.filter(result, {"type": "raintank-kubernetes-datasource", "name": id})[0];
      })
      .then(ds => {
        this.cluster = ds;
        return this.datasourceSrv.get(ds.name);
      }).then(clusterDS => {
        this.clusterDS = clusterDS;
        return clusterDS;
      });
  }

  goToNodeDashboard(node) {
    const querystring = this.$location.path("dashboard/db/kubernetes-node").search();
    querystring['var-node'] = node === 'All' ? 'All' : slugify(node.metadata.name);
    this.$window.location.href = this.$location.path() + '?' + this.objectToQueryString(querystring);
  }

  objectToQueryString(obj) {
    return _.reduce(obj, (result, value, key) => {
      return (!_.isNull(value) && !_.isUndefined(value)) ? (result += key + '=' + value + '&') : result;
    }, '').slice(0, -1);
  }

  conditionStatus(condition) {
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

  isConditionOk(condition) {
    return this.conditionStatus(condition).value;
  }

  conditionLastTransitionTime(condition) {
    return moment(condition.lastTransitionTime).format('YYYY-MM-DD HH:mm:ss');
  }
}

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
  return slug;
}

NodeDataCtrl.templateUrl = 'panels/partials/node_info.html';
