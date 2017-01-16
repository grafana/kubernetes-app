'use strict';

System.register(['lodash'], function (_export, _context) {
  "use strict";

  var _, _createClass, K8sDatasource;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function addNamespace(namespace) {
    return namespace ? 'namespaces/' + namespace + '/' : '';
  }

  function addLabels(labels) {
    var querystring = '';
    _.forEach(labels, function (value, label) {
      querystring += label + '%3D' + value + '%2C';
    });
    return _.trimEnd(querystring, '%2C');
  }
  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _createClass = function () {
        function defineProperties(target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty(target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties(Constructor.prototype, protoProps);
          if (staticProps) defineProperties(Constructor, staticProps);
          return Constructor;
        };
      }();

      _export('K8sDatasource', K8sDatasource = function () {
        function K8sDatasource(instanceSettings, backendSrv, $q) {
          _classCallCheck(this, K8sDatasource);

          this.type = instanceSettings.type;
          this.url = instanceSettings.url;
          this.name = instanceSettings.name;
          this.backendSrv = backendSrv;
          this.$q = $q;

          this.baseApiUrl = '/api/v1/';
        }

        _createClass(K8sDatasource, [{
          key: 'testDatasource',
          value: function testDatasource() {
            return this.backendSrv.datasourceRequest({
              url: this.url + '/',
              method: 'GET'
            }).then(function (response) {
              if (response.status === 200) {
                return { status: "success", message: "Data source is working", title: "Success" };
              }
            });
          }
        }, {
          key: '_get',
          value: function _get(apiResource) {
            return this.backendSrv.datasourceRequest({
              url: this.url + apiResource,
              method: "GET",
              headers: { 'Content-Type': 'application/json' }
            }).then(function (response) {
              return response.data;
            }, function (error) {
              return error;
            });
          }
        }, {
          key: 'getNodes',
          value: function getNodes() {
            return this._get('/api/v1/nodes').then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getNode',
          value: function getNode(name) {
            return this._get('/api/v1/nodes/' + name);
          }
        }, {
          key: 'getNamespaces',
          value: function getNamespaces() {
            return this._get('/api/v1/namespaces').then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getComponentStatuses',
          value: function getComponentStatuses() {
            return this._get('/api/v1/componentstatuses').then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getDaemonSets',
          value: function getDaemonSets(namespace) {
            return this._get('/apis/extensions/v1beta1/' + addNamespace(namespace) + 'daemonsets').then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getReplicationControllers',
          value: function getReplicationControllers(namespace) {
            return this._get('/api/v1/' + addNamespace(namespace) + 'replicationcontrollers').then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getDeployments',
          value: function getDeployments(namespace) {
            return this._get('/apis/extensions/v1beta1/' + addNamespace(namespace) + 'deployments').then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getPods',
          value: function getPods(namespace) {
            return this._get('/api/v1/' + addNamespace(namespace) + 'pods').then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getPodsByLabel',
          value: function getPodsByLabel(namespace, labels) {
            return this._get('/api/v1/' + addNamespace(namespace) + 'pods?labelSelector=' + addLabels(labels)).then(function (result) {
              return result.items;
            });
          }
        }, {
          key: 'getPod',
          value: function getPod(name) {
            return this._get('/api/v1/pods/?fieldSelector=metadata.name%3D' + name).then(function (result) {
              if (result.items && result.items.length === 1) {
                return result.items[0];
              } else {
                return result.items;
              }
            });
          }
        }, {
          key: 'getPodsByName',
          value: function getPodsByName(names) {
            var _this = this;

            var promises = [];
            if (Array.isArray(names)) {
              _.forEach(names, function (name) {
                promises.push(_this.getPod(name));
              });
              return this.$q.all(promises);
            } else {
              return this.getPod(names).then(function (pod) {
                return [pod];
              });
            }
          }
        }]);

        return K8sDatasource;
      }());

      _export('K8sDatasource', K8sDatasource);
    }
  };
});
//# sourceMappingURL=datasource.js.map
