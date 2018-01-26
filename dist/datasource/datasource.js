///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['lodash'], function(exports_1) {
    var lodash_1;
    var K8sDatasource;
    function addNamespace(namespace) {
        return namespace ? 'namespaces/' + namespace + '/' : '';
    }
    function addLabels(labels) {
        var querystring = '';
        lodash_1.default.forEach(labels, function (value, label) {
            querystring += label + '%3D' + value + '%2C';
        });
        return lodash_1.default.trimEnd(querystring, '%2C');
    }
    return {
        setters:[
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            }],
        execute: function() {
            K8sDatasource = (function () {
                function K8sDatasource(instanceSettings, backendSrv, $q) {
                    this.backendSrv = backendSrv;
                    this.$q = $q;
                    this.type = instanceSettings.type;
                    this.url = instanceSettings.url;
                    this.name = instanceSettings.name;
                    this.id = instanceSettings.id;
                    this.backendSrv = backendSrv;
                    this.$q = $q;
                }
                K8sDatasource.prototype.testDatasource = function () {
                    return this.backendSrv.datasourceRequest({
                        url: this.url + '/',
                        method: 'GET'
                    }).then(function (response) {
                        if (response.status === 200) {
                            return { status: "success", message: "Data source is working", title: "Success" };
                        }
                    });
                };
                K8sDatasource.prototype._get = function (apiResource) {
                    return this.backendSrv.datasourceRequest({
                        url: this.url + apiResource,
                        method: "GET",
                        headers: { 'Content-Type': 'application/json' }
                    }).then(function (response) {
                        return response.data;
                    }, function (error) {
                        return error;
                    });
                };
                K8sDatasource.prototype.getNodes = function () {
                    return this._get('/api/v1/nodes')
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getNode = function (name) {
                    return this._get('/api/v1/nodes/' + name);
                };
                K8sDatasource.prototype.getNamespaces = function () {
                    return this._get('/api/v1/namespaces')
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getComponentStatuses = function () {
                    return this._get('/api/v1/componentstatuses')
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getDaemonSets = function (namespace) {
                    return this._get('/apis/extensions/v1beta1/' + addNamespace(namespace) + 'daemonsets')
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getReplicationControllers = function (namespace) {
                    return this._get('/api/v1/' + addNamespace(namespace) + 'replicationcontrollers')
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getDeployments = function (namespace) {
                    return this._get('/apis/extensions/v1beta1/' + addNamespace(namespace) + 'deployments')
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getPods = function (namespace) {
                    return this._get('/api/v1/' + addNamespace(namespace) + 'pods')
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getPodsByLabel = function (namespace, labels) {
                    return this._get('/api/v1/' + addNamespace(namespace) + 'pods?labelSelector=' + addLabels(labels))
                        .then(function (result) {
                        return result.items;
                    });
                };
                K8sDatasource.prototype.getPod = function (name) {
                    return this._get('/api/v1/pods/?fieldSelector=metadata.name%3D' + name)
                        .then(function (result) {
                        if (result.items && result.items.length === 1) {
                            return result.items[0];
                        }
                        else {
                            return result.items;
                        }
                    });
                };
                K8sDatasource.prototype.getPodsByName = function (names) {
                    var _this = this;
                    var promises = [];
                    if (Array.isArray(names)) {
                        lodash_1.default.forEach(names, function (name) {
                            promises.push(_this.getPod(name));
                        });
                        return this.$q.all(promises);
                    }
                    else {
                        return this.getPod(names)
                            .then(function (pod) {
                            return [pod];
                        });
                    }
                };
                K8sDatasource.baseApiUrl = '/api/v1/';
                return K8sDatasource;
            })();
            exports_1("K8sDatasource", K8sDatasource);
        }
    }
});
//# sourceMappingURL=datasource.js.map