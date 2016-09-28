"use strict";

System.register(["lodash"], function (_export, _context) {
  "use strict";

  var _, _createClass, ClusterConfigCtrl, configMap, snapTask, daemonSet;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function slugify(str) {
    var slug = str.replace("@", "at").replace("&", "and").replace(".", "_").replace("/\W+/", "");
    return slug;
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

      _export("ClusterConfigCtrl", ClusterConfigCtrl = function () {
        /** @ngInject */
        function ClusterConfigCtrl($scope, $injector, backendSrv, $q, contextSrv, $location, $window) {
          _classCallCheck(this, ClusterConfigCtrl);

          var self = this;
          this.$q = $q;
          this.backendSrv = backendSrv;
          this.isOrgEditor = contextSrv.hasRole('Editor') || contextSrv.hasRole('Admin');
          this.$window = $window;
          this.$location = $location;
          this.cluster = { type: 'raintank-kubernetes-datasource' };
          this.pageReady = false;
          this.snapDeployed = false;
          var promises = [];
          if ("cluster" in $location.search()) {
            promises.push(self.getCluster($location.search().cluster).then(function () {
              return self.getDaemonSets().then(function (ds) {
                _.forEach(ds.items, function (daemonSet) {
                  if (daemonSet.metadata.name === "snap") {
                    self.snapDeployed = true;
                  }
                });
              });
            }));
          }

          promises.push(self.getGraphiteDatasources());

          $q.all(promises).then(function () {
            self.pageReady = true;
          });
        }

        _createClass(ClusterConfigCtrl, [{
          key: "getCluster",
          value: function getCluster(id) {
            var self = this;
            return this.backendSrv.get('/api/datasources/' + id).then(function (ds) {
              if (!ds.jsonData.ds) {
                ds.jsonData.ds = "";
              }
              self.cluster = ds;
            });
          }
        }, {
          key: "getGraphiteDatasources",
          value: function getGraphiteDatasources() {
            var self = this;
            return this.backendSrv.get('/api/datasources').then(function (result) {
              self.datasources = _.filter(result, { "type": "graphite" });
            });
          }
        }, {
          key: "getDaemonSets",
          value: function getDaemonSets() {
            var self = this;
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/apis/extensions/v1beta1/daemonsets',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: "save",
          value: function save() {
            var self = this;
            if (this.cluster.id) {
              return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster).then(function () {
                self.$location.path('plugins/raintank-kubernetes-app/page/clusters');
              });
            } else {
              return this.backendSrv.post('/api/datasources', this.cluster).then(function () {
                self.$location.path('plugins/raintank-kubernetes-app/page/clusters');
              });
            }
          }
        }, {
          key: "deploySnap",
          value: function deploySnap() {
            var _this = this;

            var self = this;
            var task = _.cloneDeep(snapTask);
            task.workflow.collect.publish[0].config.prefix = "snap." + slugify(self.cluster.name) + ".<%NODE%>";
            task.workflow.collect.publish[0].config.port = self.cluster.jsonData.port;
            task.workflow.collect.publish[0].config.server = self.cluster.jsonData.server;
            var cm = _.cloneDeep(configMap);
            cm.data["core.json"] = JSON.stringify(task);
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/configmaps',
              method: 'POST',
              data: cm,
              headers: { 'Content-Type': 'application/json' }
            }).then(function () {
              return self.backendSrv.request({
                url: 'api/datasources/proxy/' + self.cluster.id + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets',
                method: 'POST',
                data: daemonSet,
                headers: { 'Content-Type': "application/json" }
              }).then(function () {
                _this.snapDeployed = true;
              });
            });
          }
        }, {
          key: "cancel",
          value: function cancel() {
            this.$window.history.back();
          }
        }]);

        return ClusterConfigCtrl;
      }());

      _export("ClusterConfigCtrl", ClusterConfigCtrl);

      ClusterConfigCtrl.templateUrl = 'components/clusters/cluster_config.html';

      configMap = {
        "kind": "ConfigMap",
        "apiVersion": "v1",
        "metadata": {
          "name": "snap-tasks",
          "namespace": "kube-system"
        },
        "data": {
          "core.json": ""
        }
      };
      snapTask = {
        "version": 1,
        "schedule": {
          "type": "simple",
          "interval": "10s"
        },
        "workflow": {
          "collect": {
            "metrics": {
              "/intel/docker/*": {},
              "/intel/procfs/cpu/*": {},
              "/intel/procfs/meminfo/*": {},
              "/intel/procfs/iface/*": {},
              "/intel/linux/iostat/*": {},
              "/intel/procfs/load/*": {}
            },
            "config": {
              "/intel/procfs": {
                "proc_path": "/proc_host"
              }
            },
            "process": null,
            "publish": [{
              "plugin_name": "graphite",
              "config": {
                "prefix": "",
                "server": "",
                "port": 2003
              }
            }]
          }
        }
      };
      daemonSet = {
        "kind": "DaemonSet",
        "apiVersion": "extensions/v1beta1",
        "metadata": {
          "name": "snap",
          "namespace": "kube-system",
          "labels": {
            "daemon": "snapd"
          }
        },
        "spec": {
          "selector": {
            "matchLabels": {
              "daemon": "snapd"
            }
          },
          "template": {
            "metadata": {
              "name": "snap",
              "labels": {
                "daemon": "snapd"
              }
            },
            "spec": {
              "volumes": [{
                "name": "dev",
                "hostPath": {
                  "path": "/dev"
                }
              }, {
                "name": "cgroup",
                "hostPath": {
                  "path": "/sys/fs/cgroup"
                }
              }, {
                "name": "docker-sock",
                "hostPath": {
                  "path": "/var/run/docker.sock"
                }
              }, {
                "name": "fs-stats",
                "hostPath": {
                  "path": "/var/lib/docker"
                }
              }, {
                "name": "docker",
                "hostPath": {
                  "path": "/usr/bin/docker"
                }
              }, {
                "name": "proc",
                "hostPath": {
                  "path": "/proc"
                }
              }, {
                "name": "snap-tasks",
                "configMap": {
                  "name": "snap-tasks"
                }
              }],
              "containers": [{
                "name": "snap",
                "image": "raintank/snap_k8s:v4",
                "ports": [{
                  "name": "snap-api",
                  "hostPort": 8181,
                  "containerPort": 8181,
                  "protocol": "TCP"
                }],
                "env": [{
                  "name": "PROCFS_MOUNT",
                  "value": "/proc_host"
                }],
                "resources": {},
                "volumeMounts": [{
                  "name": "cgroup",
                  "mountPath": "/sys/fs/cgroup"
                }, {
                  "name": "docker-sock",
                  "mountPath": "/var/run/docker.sock"
                }, {
                  "name": "fs-stats",
                  "mountPath": "/var/lib/docker"
                }, {
                  "name": "docker",
                  "mountPath": "/usr/local/bin/docker"
                }, {
                  "name": "proc",
                  "mountPath": "/proc_host"
                }, {
                  "name": "snap-tasks",
                  "mountPath": "/opt/snap/tasks"
                }],
                "imagePullPolicy": "IfNotPresent",
                "securityContext": {
                  "privileged": true
                }
              }],
              "restartPolicy": "Always",
              "hostNetwork": true,
              "hostPID": true
            }
          }
        }
      };
    }
  };
});
//# sourceMappingURL=clusterConfig.js.map
