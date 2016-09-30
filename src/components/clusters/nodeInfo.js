import _ from 'lodash';
import $ from 'jquery';

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
  return slug;
}

export class NodeInfoCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, $q, $location, alertSrv) {
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.$location = $location;
    this.pageReady = false;
    this.node = {};
    // this.componentStatuses = [];
    // this.namespaces = [];
    // this.namespace = "";
    // this.nodes = [];
    // this.daemonSets = [];
    // this.replicationControllers = [];
    // this.deployments = [];
    // this.pods = [];
    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
    }

    this.getNode($location.search().node)
      .then(() => {
        this.pageReady = true;
        console.log(this.node);
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
}

NodeInfoCtrl.templateUrl = 'components/clusters/node_info.html';