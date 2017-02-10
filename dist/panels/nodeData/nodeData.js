'use strict';

System.register(['moment', 'app/plugins/sdk', 'lodash', './nodeStats'], function (_export, _context) {
  "use strict";

  var moment, PanelCtrl, _, NodeStatsDatasource, _createClass, panelDefaults, NodeDataCtrl;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  }

  function slugify(str) {
    var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
    return slug;
  }

  function unslugify(str) {
    var slug = str.replace(/[_]/g, ".");
    return slug;
  }

  return {
    setters: [function (_moment) {
      moment = _moment.default;
    }, function (_appPluginsSdk) {
      PanelCtrl = _appPluginsSdk.PanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }, function (_nodeStats) {
      NodeStatsDatasource = _nodeStats.default;
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

      panelDefaults = {};

      _export('NodeDataCtrl', NodeDataCtrl = function (_PanelCtrl) {
        _inherits(NodeDataCtrl, _PanelCtrl);

        /** @ngInject */
        function NodeDataCtrl($scope, $injector, backendSrv, datasourceSrv, $location, alertSrv, timeSrv, variableSrv) {
          _classCallCheck(this, NodeDataCtrl);

          var _this = _possibleConstructorReturn(this, (NodeDataCtrl.__proto__ || Object.getPrototypeOf(NodeDataCtrl)).call(this, $scope, $injector));

          _.defaults(_this.panel, panelDefaults);

          _this.backendSrv = backendSrv;
          _this.datasourceSrv = datasourceSrv;
          _this.$location = $location;
          _this.alertSrv = alertSrv;
          _this.timeSrv = timeSrv;
          _this.variableSrv = variableSrv;
          _this.templateVariables = _this.variableSrv.variables;
          _this.nodeStatsDatasource = new NodeStatsDatasource(datasourceSrv, timeSrv);
          document.title = 'Grafana Kubernetes App';

          _this.pageReady = false;
          _this.cluster = {};
          _this.clusterDS = {};
          _this.node = {};

          _this.isInListMode = false;
          _this.nodes = [];

          _this.loadCluster();
          return _this;
        }

        _createClass(NodeDataCtrl, [{
          key: 'loadCluster',
          value: function loadCluster() {
            var _this2 = this;

            var cluster = _.find(this.templateVariables, { 'name': 'cluster' });
            if (!cluster) {
              this.alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
              return;
            } else {
              (function () {
                var cluster_id = cluster.current.value;
                var nodeVar = _.find(_this2.templateVariables, { 'name': 'node' });
                var node_name = nodeVar.current.value !== '$__all' ? nodeVar.current.value : 'All';
                var graphiteDs = _.find(_this2.templateVariables, { 'name': 'datasource' }).current.value;

                _this2.loadDatasource(cluster_id).then(function () {
                  return _this2.nodeStatsDatasource.getNodeStats(cluster_id, graphiteDs);
                }).then(function (nodeStats) {
                  if (node_name === 'All') {
                    _this2.isInListMode = true;
                    _this2.clusterDS.getNodes().then(function (nodes) {
                      _this2.nodes = _.map(nodes, function (node) {
                        node.healthState = _this2.getNodeHealth(node);
                        _this2.nodeStatsDatasource.updateNodeWithStats(node, nodeStats);

                        return node;
                      });
                    });
                  } else {
                    _this2.isInListMode = false;
                    _this2.clusterDS.getNode(unslugify(node_name)).then(function (node) {
                      _this2.node = node;
                      _this2.pageReady = true;
                    });
                  }
                });
              })();
            }
          }
        }, {
          key: 'getNodeHealth',
          value: function getNodeHealth(node) {
            var health = "unhealthy";
            var message = '';
            _.forEach(node.status.conditions, function (condition) {
              if (condition.type === "Ready" && condition.status === "True") {
                health = "ok";
              } else {
                message = condition.message;
              }
            });
            return this.getHealthState(health, message);
          }
        }, {
          key: 'getHealthState',
          value: function getHealthState(health, message) {
            switch (health) {
              case 'ok':
                {
                  return {
                    text: 'OK',
                    iconClass: 'icon-gf icon-gf-online',
                    stateClass: 'alert-state-ok'
                  };
                }
              case 'unhealthy':
                {
                  return {
                    text: 'UNHEALTHY',
                    iconClass: 'icon-gf icon-gf-critical',
                    stateClass: 'alert-state-critical',
                    message: message || ''
                  };
                }
              case 'warning':
                {
                  return {
                    text: 'warning',
                    iconClass: "icon-gf icon-gf-critical",
                    stateClass: 'alert-state-warning',
                    message: message || ''
                  };
                }
            }
          }
        }, {
          key: 'refresh',
          value: function refresh() {
            this.loadCluster();
          }
        }, {
          key: 'loadDatasource',
          value: function loadDatasource(id) {
            var _this3 = this;

            return this.backendSrv.get('api/datasources').then(function (result) {
              return _.filter(result, { "type": "raintank-kubernetes-datasource", "name": id })[0];
            }).then(function (ds) {
              if (!ds) {
                _this3.alertSrv.set("Failed to connect", "Could not connect to the specified cluster.", 'error');
                throw "Failed to connect to " + id;
              }
              _this3.cluster = ds;
              return _this3.datasourceSrv.get(ds.name);
            }).then(function (clusterDS) {
              _this3.clusterDS = clusterDS;
              return clusterDS;
            });
          }
        }, {
          key: 'goToNodeDashboard',
          value: function goToNodeDashboard(node) {
            var _this4 = this;

            var variable = _.find(this.templateVariables, { 'name': 'node' });
            variable.current.text = node === 'All' ? 'All' : slugify(node.metadata.name);
            variable.current.value = node === 'All' ? '$__all' : slugify(node.metadata.name);

            this.variableSrv.variableUpdated(variable).then(function () {
              _this4.$scope.$emit('template-variable-value-updated');
              _this4.$scope.$root.$broadcast('refresh');
            });
          }
        }, {
          key: 'conditionStatus',
          value: function conditionStatus(condition) {
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
        }, {
          key: 'isConditionOk',
          value: function isConditionOk(condition) {
            return this.conditionStatus(condition).value;
          }
        }, {
          key: 'conditionLastTransitionTime',
          value: function conditionLastTransitionTime(condition) {
            return moment(condition.lastTransitionTime).format('YYYY-MM-DD HH:mm:ss');
          }
        }]);

        return NodeDataCtrl;
      }(PanelCtrl));

      _export('NodeDataCtrl', NodeDataCtrl);

      NodeDataCtrl.templateUrl = 'panels/nodeData/partials/node_info.html';
    }
  };
});
//# sourceMappingURL=nodeData.js.map
