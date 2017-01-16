import _ from 'lodash';

export class K8sDatasource {
  constructor(instanceSettings, backendSrv, $q) {
    this.type = instanceSettings.type;
    this.url = instanceSettings.url;
    this.name = instanceSettings.name;
    this.backendSrv = backendSrv;
    this.$q = $q;

    this.baseApiUrl = '/api/v1/';
  }

  testDatasource() {
    return this.backendSrv.datasourceRequest({
      url: this.url + '/',
      method: 'GET'
    }).then(response => {
      if (response.status === 200) {
        return { status: "success", message: "Data source is working", title: "Success" };
      }
    });
  }

  _get(apiResource) {
    return this.backendSrv.datasourceRequest({
      url: this.url + apiResource,
      method: "GET",
      headers: { 'Content-Type': 'application/json' }
    }).then(
      response => {
        return response.data;
      }, error => {
        return error;
      });
  }

  getNodes() {
    return this._get('/api/v1/nodes')
      .then(result => {
        return result.items;
      });
  }

  getNode(name) {
    return this._get('/api/v1/nodes/' + name);
  }

  getNamespaces() {
    return this._get('/api/v1/namespaces')
      .then(result => {
        return result.items;
      });
  }

  getComponentStatuses() {
    return this._get('/api/v1/componentstatuses')
      .then(result => {
        return result.items;
      });
  }

  getDaemonSets(namespace) {
    return this._get('/apis/extensions/v1beta1/' + addNamespace(namespace) + 'daemonsets')
      .then(result => {
        return result.items;
      });
  }

  getReplicationControllers(namespace) {
    return this._get('/api/v1/' + addNamespace(namespace) + 'replicationcontrollers')
      .then(result => {
        return result.items;
      });
  }

  getDeployments(namespace) {
    return this._get('/apis/extensions/v1beta1/' + addNamespace(namespace) + 'deployments')
      .then(result => {
        return result.items;
      });
  }

  getPods(namespace) {
    return this._get('/api/v1/' + addNamespace(namespace) + 'pods')
      .then(result => {
        return result.items;
      });
  }

  getPodsByLabel(namespace, labels) {
    return this._get('/api/v1/' + addNamespace(namespace) + 'pods?labelSelector=' + addLabels(labels))
      .then(result => {
        return result.items;
      });
  }

  getPod(name) {
    return this._get('/api/v1/pods/?fieldSelector=metadata.name%3D' + name)
    .then(result => {
      if (result.items && result.items.length === 1) {
        return result.items[0];
      } else {
        return result.items;
      }
    });
  }

  getPodsByName(names) {
    const promises = [];
    if (Array.isArray(names)) {
      _.forEach(names, name => {
        promises.push(this.getPod(name));
      });
      return this.$q.all(promises);
    } else {
      return this.getPod(names)
      .then(pod => {
        return [pod];
      });
    }
  }
}

function addNamespace(namespace) {
  return namespace ? 'namespaces/' + namespace + '/' : '';
}

function addLabels(labels) {
  let querystring = '';
  _.forEach(labels, (value, label) => {
    querystring += label + '%3D' + value + '%2C';
  });
  return _.trimEnd(querystring, '%2C');
}
