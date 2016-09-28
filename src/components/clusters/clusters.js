import _ from 'lodash';
import $ from 'jquery';

export class ClustersCtrl {
  /** @ngInject */
  constructor($scope, $injector, backendSrv, contextSrv, $location) {
    var self = this;
    this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
    this.backendSrv = backendSrv;
    this.$location = $location;
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

  clusterInfo(cluster, evt) {
    var clickTargetIsLinkOrHasLinkParents = $(evt.target).closest('a').length > 0;
    if (clickTargetIsLinkOrHasLinkParents === false) {
      this.$location.path("plugins/raintank-kubernetes-app/page/cluster-info").search({"cluster": cluster.id});
    }
  }
}

ClustersCtrl.templateUrl = 'components/clusters/clusters.html';
