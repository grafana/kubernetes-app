import moment from 'moment';

export class PodInfoCtrl {
  pageReady: boolean;
  pod: any;
  cluster_id: any;
  clusterDS: any;
  datasource: any;

  static templateUrl = 'components/clusters/partials/pod_info.html';

  /** @ngInject */
  constructor($scope, $injector, private backendSrv, private datasourceSrv, private $q, private $location, private alertSrv) {
    document.title = 'Grafana Kubernetes App';

    this.pageReady = false;
    this.pod = {};
    if (!("cluster" in $location.search())) {
      alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
      return;
    } else {
      this.cluster_id = $location.search().cluster;
      const pod_name    = $location.search().pod;

      this.loadDatasource(this.cluster_id).then(() => {
        this.clusterDS.getPod(pod_name).then(pod => {
          this.pod = pod;
          this.pageReady = true;
        });
      });
    }
  }

  loadDatasource(id) {
    return this.backendSrv.get('api/datasources/' + id)
      .then(ds => {
        this.datasource = ds.jsonData.ds;
        return this.datasourceSrv.get(ds.name);
      }).then(clusterDS => {
        this.clusterDS = clusterDS;
        return clusterDS;
      });
  }

  conditionStatus(condition) {
    let status;
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

  goToPodDashboard(pod) {
    this.$location.path("dashboard/db/k8s-container")
    .search({
      "var-datasource": this.datasource,
      "var-cluster": this.clusterDS.name,
      "var-node": pod.spec.nodeName,
      "var-namespace": pod.metadata.namespace,
      "var-pod": pod.metadata.name
    });
  }

  isConditionOk(condition) {
    return this.conditionStatus(condition).value;
  }

  formatTime(time) {
    return moment(time).format('YYYY-MM-DD HH:mm:ss');
  }
}
