import moment from 'moment';

export class NodeInfoCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, $q, $location, alertSrv) {
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.$location = $location;
    this.pageReady = false;
    this.node = {};
    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
    }

    this.getNode($location.search().node)
      .then(() => {
        this.pageReady = true;
      });
  }

  k8sApiRequest_GET(api_resource) {
    return this.backendSrv.request({
      url: 'api/datasources/proxy/' + this.cluster_id + '/api/v1/' + api_resource,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
  }

  getNode(name) {
    return this.k8sApiRequest_GET('nodes/' + name)
      .then((node) => {
        this.node = node;
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

NodeInfoCtrl.templateUrl = 'components/clusters/node_info.html';