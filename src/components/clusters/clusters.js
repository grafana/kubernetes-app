import _ from 'lodash';
import appEvents from 'app/core/app_events';

export class ClustersCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, contextSrv, $location) {
    var self = this;
    this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
    this.backendSrv = backendSrv;
    this.$location = $location;
    document.title = 'Grafana Kubernetes App';
    this.clusters = {};
    this.pageReady = false;
    this.getClusters().then(() => {
      self.pageReady = true;
    });
  }

  getClusters() {
    var self = this;
    return this.backendSrv.get('/api/datasources')
    .then((result) => {
      self.clusters = _.filter(result, {"type": "raintank-kubernetes-datasource"});
    });
  }

  confirmDelete(id) {
    this.backendSrv.delete('/api/datasources/' + id).then(() => {
      this.getClusters();
    });
  }

  deleteCluster(cluster) {
    appEvents.emit('confirm-modal', {
      title: 'Delete',
      text: 'Are you sure you want to delete this data source? ' +
        'If you need to undeploy the collectors, then do that before deleting the data source.',
      yesText: "Delete",
      icon: "fa-trash",
      onConfirm: () => {
        this.confirmDelete(cluster.id);
      }
    });
  }

  clusterInfo(cluster) {
    this.$location.path("plugins/raintank-kubernetes-app/page/cluster-info").search({"cluster": cluster.id});
  }
}

ClustersCtrl.templateUrl = 'components/clusters/partials/clusters.html';
