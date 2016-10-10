export class K8sClusterAPI {
  /** @ngInject */
  constructor(clusterID, backendSrv) {
    this.cluster_id = clusterID;
    this.backendSrv = backendSrv;
    this.baseUrl = 'api/datasources/proxy/' + this.cluster_id;
    this.baseApiUrl = this.baseUrl + '/api/v1/';
  }

  get(apiResource) {
    return this.backendSrv.get(this.baseApiUrl + apiResource);
  }

  getRawResource(rawApiResourceUrl) {
    return this.backendSrv.get(this.baseUrl + rawApiResourceUrl);
  }
}
