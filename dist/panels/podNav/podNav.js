'use strict';

System.register(['app/plugins/sdk', 'lodash'], function (_export, _context) {
  "use strict";

  var PanelCtrl, _, _typeof, _createClass, panelDefaults, PodNavCtrl;

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

  return {
    setters: [function (_appPluginsSdk) {
      PanelCtrl = _appPluginsSdk.PanelCtrl;
    }, function (_lodash) {
      _ = _lodash.default;
    }],
    execute: function () {
      _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
      } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };

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

      _export('PodNavCtrl', PodNavCtrl = function (_PanelCtrl) {
        _inherits(PodNavCtrl, _PanelCtrl);

        function PodNavCtrl($scope, $injector, backendSrv, datasourceSrv, $location, alertSrv, variableSrv, $q) {
          _classCallCheck(this, PodNavCtrl);

          var _this = _possibleConstructorReturn(this, (PodNavCtrl.__proto__ || Object.getPrototypeOf(PodNavCtrl)).call(this, $scope, $injector));

          _.defaults(_this.panel, panelDefaults);

          _this.backendSrv = backendSrv;
          _this.datasourceSrv = datasourceSrv;
          _this.$location = $location;
          _this.alertSrv = alertSrv;
          _this.variableSrv = variableSrv;
          _this.$q = $q;

          _this.templateVariables = _this.variableSrv.variables;
          _this.namespace = "All";
          _this.currentTags = {};
          _this.currentPods = [];
          _this.selectedPods = [];

          _this.setDefaults();
          _this.loadTags();
          _this.chosenTags = {};
          return _this;
        }

        _createClass(PodNavCtrl, [{
          key: 'refresh',
          value: function refresh() {
            if (this.needsRefresh()) {
              this.currentTags = {};
              this.currentPods = [];
              this.chosenTags = {};
              this.selectedPods = [];

              this.setDefaults();
              this.loadTags();
            }
          }
        }, {
          key: 'needsRefresh',
          value: function needsRefresh() {
            var cluster = _.find(this.templateVariables, { 'name': 'cluster' });
            var ns = _.find(this.templateVariables, { 'name': 'namespace' });

            if (this.clusterName !== cluster.current.value) {
              return true;
            }

            if ((ns.current.value === '$__all' || ns.current.value[0] === '$__all') && (this.namespace === ns.current.value || this.namespace === '')) {
              return false;
            }

            if (ns.current.value !== this.namespace) {
              return true;
            }

            return false;
          }
        }, {
          key: 'loadTags',
          value: function loadTags() {
            var _this2 = this;

            this.getCluster().then(function () {
              return _this2.getPods().then(function (pods) {
                _this2.parseTagsFromPods(pods);
                _this2.currentPods = _.uniq(_.map(pods, function (p) {
                  return p.metadata.name;
                }));
              });
            });
          }
        }, {
          key: 'setDefaults',
          value: function setDefaults() {
            var cluster = _.find(this.templateVariables, { 'name': 'cluster' });
            if (!cluster) {
              this.alertSrv.set("no cluster specified.", "no cluster specified in url", 'error');
              return;
            }

            var ns = _.find(this.templateVariables, { 'name': 'namespace' });
            this.namespace = ns.current.value !== '$__all' && ns.current.value[0] !== '$__all' ? ns.current.value : '';
            var podVariable = _.find(this.templateVariables, { 'name': 'pod' });

            if (podVariable.current.value !== '$__all') {
              this.selectedPods = _.isArray(podVariable.current.value) ? podVariable.current.value : [podVariable.current.value];
            }
          }
        }, {
          key: 'getPods',
          value: function getPods() {
            var _this3 = this;

            if (this.currentPods.length === 0) {
              if (_.isArray(this.namespace)) {
                var _ret = function () {
                  var promises = [];
                  _.forEach(_this3.namespace, function (ns) {
                    promises.push(_this3.clusterDS.getPods(ns));
                  });
                  return {
                    v: _this3.$q.all(promises).then(function (pods) {
                      return _.flatten(pods).filter(function (n) {
                        return n;
                      });
                    })
                  };
                }();

                if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
              } else {
                return this.clusterDS.getPods(this.namespace);
              }
            } else {
              return this.clusterDS.getPodsByName(this.currentPods);
            }
          }
        }, {
          key: 'parseTagsFromPods',
          value: function parseTagsFromPods(pods) {
            var _this4 = this;

            this.currentTags = {};

            _.forEach(pods, function (pod) {
              _.forEach(pod.metadata.labels, function (value, label) {
                if (!_this4.currentTags[label]) {
                  _this4.currentTags[label] = [];
                }
                if (!_this4.currentTags[label].includes(value)) {
                  _this4.currentTags[label].push(value);
                }
              });
            });
          }
        }, {
          key: 'onTagSelect',
          value: function onTagSelect() {
            var _this5 = this;

            this.removeEmptyTags();
            this.selectedPods = [];

            this.getPodsByLabel().then(function (pods) {
              _this5.currentPods = _.uniq(_.map(pods, function (p) {
                return p.metadata.name;
              }));
              _this5.parseTagsFromPods(pods);
              _this5.updateTemplateVariableWithPods();
            });
          }
        }, {
          key: 'getPodsByLabel',
          value: function getPodsByLabel() {
            var _this6 = this;

            if (_.isArray(this.namespace)) {
              var _ret2 = function () {
                var promises = [];
                _.forEach(_this6.namespace, function (ns) {
                  promises.push(_this6.clusterDS.getPodsByLabel(ns, _this6.chosenTags));
                });
                return {
                  v: _this6.$q.all(promises).then(function (pods) {
                    return _.flatten(pods).filter(function (n) {
                      return n;
                    });
                  })
                };
              }();

              if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
            } else {
              return this.clusterDS.getPodsByLabel(this.namespace, this.chosenTags);
            }
          }
        }, {
          key: 'updateTemplateVariableWithPods',
          value: function updateTemplateVariableWithPods() {
            var _this7 = this;

            var variable = _.find(this.templateVariables, { 'name': 'pod' });

            if (this.selectedPods.length > 0) {
              variable.current.text = this.selectedPods.join(' + ');
              variable.current.value = this.selectedPods;
            } else {
              variable.current.text = _.isEmpty(this.chosenTags) ? 'All' : this.currentPods.join(' + ');
              variable.current.value = _.isEmpty(this.chosenTags) ? '$__all' : this.currentPods;
            }

            this.variableSrv.updateOptions(variable).then(function () {
              _this7.variableSrv.variableUpdated(variable).then(function () {
                _this7.$scope.$emit('template-variable-value-updated');
                _this7.$scope.$root.$broadcast('refresh');
              });
            });
          }
        }, {
          key: 'removeEmptyTags',
          value: function removeEmptyTags() {
            this.chosenTags = _.omitBy(this.chosenTags, function (val) {
              return !val;
            });
          }
        }, {
          key: 'getCluster',
          value: function getCluster() {
            var _this8 = this;

            var clusterName = _.find(this.templateVariables, { 'name': 'cluster' }).current.value;
            this.clusterName = clusterName;

            return this.backendSrv.get('/api/datasources').then(function (result) {
              return _.filter(result, { "name": clusterName })[0];
            }).then(function (ds) {
              if (!ds) {
                _this8.alertSrv.set("Failed to connect", "Could not connect to the specified cluster.", 'error');
                throw "Failed to connect to " + clusterName;
              }

              if (!ds.jsonData.ds) {
                ds.jsonData.ds = "";
              }
              return _this8.datasourceSrv.get(ds.name);
            }).then(function (clusterDS) {
              _this8.clusterDS = clusterDS;
            });
          }
        }, {
          key: 'removeTag',
          value: function removeTag(tag) {
            var _this9 = this;

            delete this.chosenTags[tag];
            this.getPodsByLabel().then(function (pods) {
              _this9.currentPods = _.uniq(_.map(pods, function (p) {
                return p.metadata.name;
              }));
              _this9.parseTagsFromPods(pods);
              _this9.updateTemplateVariableWithPods();
            });
          }
        }, {
          key: 'selectPod',
          value: function selectPod(podName) {
            this.chosenTags = {};

            if (!this.selectedPods.includes(podName)) {
              this.selectedPods.push(podName);
            }

            this.updateTemplateVariableWithPods();
          }
        }, {
          key: 'removePodTag',
          value: function removePodTag(podName) {
            _.remove(this.selectedPods, function (p) {
              return p === podName;
            });
            this.updateTemplateVariableWithPods();

            if (this.selectedPods.length === 0) {
              this.currentPods = [];
              this.loadTags();
            }
          }
        }]);

        return PodNavCtrl;
      }(PanelCtrl));

      _export('PodNavCtrl', PodNavCtrl);

      PodNavCtrl.templateUrl = 'panels/podNav/partials/pod_nav.html';
    }
  };
});
//# sourceMappingURL=podNav.js.map
