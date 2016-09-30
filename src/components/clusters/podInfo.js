import _ from 'lodash';
import $ from 'jquery';

function slugify(str) {
  var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
  return slug;
}

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
        console.log(this.pod);
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
}

PodInfoCtrl.templateUrl = 'components/clusters/pod_info.html';
