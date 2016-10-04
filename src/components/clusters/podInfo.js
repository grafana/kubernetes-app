
export class PodInfoCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, $q, $location, alertSrv) {
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.$location = $location;
    this.pageReady = false;
    this.pod = {};
    if (!("cluster" in $location.search() && "namespace" in $location.search())) {
      alertSrv.set("no cluster or namespace specified.", "no cluster or namespace specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
      this.namespace = $location.search().namespace;
    }

    this.getPod($location.search().namespace, $location.search().pod)
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

  getPod(namespace, name) {
    return this.k8sApiRequest_GET('namespaces/' + namespace + '/pods/' + name)
      .then((pod) => {
        this.pod = pod;
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
}

PodInfoCtrl.templateUrl = 'components/clusters/pod_info.html';
