export class PodInfoCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, datasourceSrv, $q, $location, alertSrv) {
    this.$q = $q;
    this.backendSrv = backendSrv;
    this.datasourceSrv = datasourceSrv;
    this.$location = $location;

    this.pageReady = false;
    this.pod = {};
    if (!("cluster" in $location.search() && "namespace" in $location.search())) {
      alertSrv.set("no cluster or namespace specified.", "no cluster or namespace specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
      this.namespace  = $location.search().namespace;
      let pod_name    = $location.search().pod;

      this.loadDatasource(this.cluster_id).then(() => {
        this.clusterDS.getPod(this.namespace, pod_name).then(pod => {
          this.pod = pod;
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
}

PodInfoCtrl.templateUrl = 'components/clusters/partials/pod_info.html';
