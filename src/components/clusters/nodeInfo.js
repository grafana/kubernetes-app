import moment from 'moment';

export class NodeInfoCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.datasourceSrv = datasourceSrv;
    this.$location = $location;

    this.pageReady = false;
    this.clusterDS = {};
    this.node = {};

    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
      let node_name   = $location.search().node;

      this.loadDatasource(this.cluster_id).then(() => {
        this.clusterDS.getNode(node_name).then(node => {
          this.node = node;
          this.pageReady = true;
        });
      });
    }
  }

  loadDatasource(id) {
    return this.backendSrv.get('api/datasources/' + id)
      .then(ds => {
        return this.datasourceSrv.get(ds.name);
      }).then(clusterDS => {
        this.clusterDS = clusterDS;
        return clusterDS;
      });
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

NodeInfoCtrl.templateUrl = 'components/clusters/partials/node_info.html';
