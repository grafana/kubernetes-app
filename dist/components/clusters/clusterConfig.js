'use strict';

System.register(['lodash', 'app/core/app_events', 'angular'], function (_export, _context) {
  "use strict";

  var _, appEvents, angular, _createClass, ClusterConfigCtrl, raintankSnapImage, configMap, kubestateConfigMap, snapTask, kubestateSnapTask, daemonSet, kubestate;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function slugify(str) {
    var slug = str.replace("@", "at").replace("&", "and").replace(/[.]/g, "_").replace("/\W+/", "");
    return slug;
  }

  return {
    setters: [function (_lodash) {
      _ = _lodash.default;
    }, function (_appCoreApp_events) {
      appEvents = _appCoreApp_events.default;
    }, function (_angular) {
      angular = _angular.default;
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

      _export('ClusterConfigCtrl', ClusterConfigCtrl = function () {
        /** @ngInject */
        function ClusterConfigCtrl($scope, $injector, backendSrv, $q, contextSrv, $location, $window, alertSrv) {
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
          this.alertSrv = alertSrv;
          this.showHelp = false;
          document.title = 'Grafana Kubernetes App';

          this.getDatasources().then(function () {
            self.pageReady = true;
          });
        }

        _createClass(ClusterConfigCtrl, [{
          key: 'toggleHelp',
          value: function toggleHelp() {
            this.showHelp = !this.showHelp;
          }
        }, {
          key: 'getDatasources',
          value: function getDatasources() {
            var self = this;
            var promises = [];
            if ("cluster" in self.$location.search()) {
              promises.push(self.getCluster(this.$location.search().cluster).then(function () {
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

            return this.$q.all(promises);
          }
        }, {
          key: 'getCluster',
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
          key: 'getGraphiteDatasources',
          value: function getGraphiteDatasources() {
            var self = this;
            return this.backendSrv.get('/api/datasources').then(function (result) {
              self.datasources = _.filter(result, { "type": "graphite" });
            });
          }
        }, {
          key: 'getDaemonSets',
          value: function getDaemonSets() {
            var self = this;
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/apis/extensions/v1beta1/daemonsets',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: 'save',
          value: function save() {
            var _this = this;

            return this.saveDatasource().then(function () {
              return _this.getDatasources();
            }).then(function () {
              _this.alertSrv.set("Saved", "Saved and successfully connected to " + _this.cluster.name, 'success', 3000);
            }).catch(function (err) {
              _this.alertSrv.set("Saved", "Saved but failed to connect to " + _this.cluster.name + '. Error: ' + err, 'error', 5000);
            });
          }
        }, {
          key: 'saveConfigMapToFile',
          value: function saveConfigMapToFile() {
            var cm = this.generateConfigMap();
            this.saveToFile('snap-configmap', cm);
          }
        }, {
          key: 'saveKubestateConfigMapToFile',
          value: function saveKubestateConfigMapToFile() {
            var cm = this.generateKubestateConfigMap();
            this.saveToFile('snap-kubestate-configmap', cm);
          }
        }, {
          key: 'saveDaemonSetToFile',
          value: function saveDaemonSetToFile() {
            this.saveToFile('snap-daemonset', daemonSet);
          }
        }, {
          key: 'saveDeploymentToFile',
          value: function saveDeploymentToFile() {
            this.saveToFile('snap-kubestate', kubestate);
          }
        }, {
          key: 'saveToFile',
          value: function saveToFile(filename, json) {
            var blob = new Blob([angular.toJson(json, true)], { type: "application/json;charset=utf-8" });
            var wnd = window;
            wnd.saveAs(blob, filename + '.json');
          }
        }, {
          key: 'deploy',
          value: function deploy() {
            var _this2 = this;

            var question = !this.snapDeployed ? 'This action will deploy a DaemonSet to your Kubernetes cluster. It uses Intel Snap to collect health metrics. ' + 'Are you sure you want to deploy?' : 'This action will update the Config Map for the Snap DaemonSet and recreate the snapd pod on your Kubernetes cluster. ' + 'Are you sure you want to deploy?';
            appEvents.emit('confirm-modal', {
              title: 'Deploy to Kubernetes Cluster',
              text: question,
              yesText: "Deploy",
              icon: "fa-question",
              onConfirm: function onConfirm() {
                _this2.saveAndDeploy();
              }
            });
          }
        }, {
          key: 'undeploy',
          value: function undeploy() {
            var _this3 = this;

            var question = 'This action will remove the DaemonSet on your Kubernetes cluster that collects health metrics. ' + 'Are you sure you want to remove it?';

            appEvents.emit('confirm-modal', {
              title: 'Remove Daemonset Collector',
              text: question,
              yesText: "Remove",
              icon: "fa-question",
              onConfirm: function onConfirm() {
                _this3.undeploySnap();
              }
            });
          }
        }, {
          key: 'saveDatasource',
          value: function saveDatasource() {
            if (this.cluster.id) {
              return this.backendSrv.put('/api/datasources/' + this.cluster.id, this.cluster);
            } else {
              return this.backendSrv.post('/api/datasources', this.cluster);
            }
          }
        }, {
          key: 'saveAndDeploy',
          value: function saveAndDeploy() {
            var _this4 = this;

            return this.saveDatasource().then(function () {
              return _this4.deploySnap();
            });
          }
        }, {
          key: 'generateConfigMap',
          value: function generateConfigMap() {
            var task = _.cloneDeep(snapTask);
            task.workflow.collect.publish[0].config.prefix = "snap." + slugify(this.cluster.name) + ".<%NODE%>";
            task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
            task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
            var cm = _.cloneDeep(configMap);
            cm.data["core.json"] = JSON.stringify(task);
            return cm;
          }
        }, {
          key: 'generateKubestateConfigMap',
          value: function generateKubestateConfigMap() {
            var task = _.cloneDeep(kubestateSnapTask);
            task.workflow.collect.publish[0].config.prefix = "snap." + slugify(this.cluster.name);
            task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
            task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
            var cm = _.cloneDeep(kubestateConfigMap);
            cm.data["core.json"] = JSON.stringify(task);
            return cm;
          }
        }, {
          key: 'deploySnap',
          value: function deploySnap() {
            var _this5 = this;

            if (!this.cluster || !this.cluster.id) {
              this.alertSrv.set("Error", "Could not connect to cluster.", 'error');
              return;
            }

            var self = this;
            var cm = this.generateConfigMap();
            var kubestateCm = this.generateKubestateConfigMap();

            if (!this.snapDeployed) {
              return this.checkApiVersion(self.cluster.id).then(function () {
                return _this5.createConfigMap(self.cluster.id, cm);
              }).then(function () {
                return _this5.createConfigMap(self.cluster.id, kubestateCm);
              }).then(function () {
                return _this5.createDaemonSet(self.cluster.id, daemonSet);
              }).then(function () {
                return _this5.createDeployment(self.cluster.id, kubestate);
              }).catch(function (err) {
                _this5.alertSrv.set("Error", err, 'error');
              }).then(function () {
                _this5.snapDeployed = true;
                _this5.alertSrv.set("Deployed", "Snap DaemonSet for Kubernetes metrics deployed to " + self.cluster.name, 'success', 5000);
              });
            } else {
              return self.updateSnapSettings(cm, kubestateCm);
            }
          }
        }, {
          key: 'undeploySnap',
          value: function undeploySnap() {
            var _this6 = this;

            var self = this;
            return this.deleteConfigMap(self.cluster.id, 'snap-tasks').then(function () {
              return _this6.deleteConfigMap(self.cluster.id, 'snap-tasks-kubestate');
            }).catch(function (err) {
              _this6.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this6.deleteDaemonSet(self.cluster.id);
            }).catch(function (err) {
              _this6.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this6.deleteDeployment(self.cluster.id, 'snap-kubestate-deployment');
            }).catch(function (err) {
              _this6.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this6.deletePods();
            }).catch(function (err) {
              _this6.alertSrv.set("Error", err, 'error');
            }).then(function () {
              _this6.snapDeployed = false;
              _this6.alertSrv.set("Daemonset removed", "Snap DaemonSet for Kubernetes metrics removed from " + self.cluster.name, 'success', 5000);
            });
          }
        }, {
          key: 'checkApiVersion',
          value: function checkApiVersion(clusterId) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }).then(function (result) {
              if (!result.resources || result.resources.length === 0) {
                throw "This Kubernetes cluster does not support v1beta1 of the API which is needed to deploy automatically. " + "You can install manually using the instructions at the bottom of the page.";
              }
            });
          }
        }, {
          key: 'createConfigMap',
          value: function createConfigMap(clusterId, cm) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/configmaps',
              method: 'POST',
              data: cm,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }, {
          key: 'createDaemonSet',
          value: function createDaemonSet(clusterId, daemonSet) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets',
              method: 'POST',
              data: daemonSet,
              headers: { 'Content-Type': "application/json" }
            });
          }
        }, {
          key: 'deleteDaemonSet',
          value: function deleteDaemonSet(clusterId) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets/snap',
              method: 'DELETE'
            });
          }
        }, {
          key: 'createDeployment',
          value: function createDeployment(clusterId, deployment) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/deployments',
              method: 'POST',
              data: deployment,
              headers: { 'Content-Type': "application/json" }
            });
          }
        }, {
          key: 'deleteDeployment',
          value: function deleteDeployment(clusterId, deploymentName) {
            var _this7 = this;

            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/deployments/' + deploymentName,
              method: 'DELETE'
            }).then(function () {
              return _this7.backendSrv.request({
                url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/replicasets?labelSelector=app%3Dsnap-collector',
                method: 'DELETE'
              });
            });
          }
        }, {
          key: 'deleteConfigMap',
          value: function deleteConfigMap(clusterId, cmName) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/configmaps/' + cmName,
              method: 'DELETE'
            });
          }
        }, {
          key: 'deletePods',
          value: function deletePods() {
            var _this8 = this;

            var self = this;
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/pods?labelSelector=app%3Dsnap-collector',
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }).then(function (pods) {
              if (!pods || pods.items.length === 0) {
                throw "No snapd pod found to update.";
              }

              var promises = [];

              _.forEach(pods.items, function (pod) {
                promises.push(_this8.backendSrv.request({
                  url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/pods/' + pod.metadata.name,
                  method: 'DELETE'
                }));
              });

              return _this8.$q.all(promises);
            });
          }
        }, {
          key: 'updateSnapSettings',
          value: function updateSnapSettings(cm, kubestateCm) {
            var _this9 = this;

            var self = this;
            return this.deleteConfigMap(self.cluster.id, 'snap-tasks').then(function () {
              return _this9.createConfigMap(self.cluster.id, cm);
            }).then(function () {
              return _this9.deleteConfigMap(self.cluster.id, 'snap-tasks-kubestate');
            }).then(function () {
              return _this9.createConfigMap(self.cluster.id, kubestateCm);
            }).then(function () {
              return _this9.deletePods();
            }).catch(function (err) {
              _this9.alertSrv.set("Error", err, 'error');
            }).then(function () {
              _this9.alertSrv.set("Updated", "Graphite Settings in Config Map on " + self.cluster.name + " updated successfully", 'success', 3000);
            });
          }
        }, {
          key: 'cancel',
          value: function cancel() {
            this.$window.history.back();
          }
        }]);

        return ClusterConfigCtrl;
      }());

      _export('ClusterConfigCtrl', ClusterConfigCtrl);

      ClusterConfigCtrl.templateUrl = 'components/clusters/partials/cluster_config.html';

      raintankSnapImage = 'raintank/snap_k8s:v21';
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
      kubestateConfigMap = {
        "kind": "ConfigMap",
        "apiVersion": "v1",
        "metadata": {
          "name": "snap-tasks-kubestate",
          "namespace": "kube-system"
        },
        "data": {
          "core.json": ""
        }
      };
      snapTask = {
        "version": 1,
        "start": true,
        "schedule": {
          "type": "simple",
          "interval": "10s"
        },
        "max-failures": 10,
        "workflow": {
          "collect": {
            "metrics": {
              "/intel/docker/*/*/*/stats/cgroups/cpu_stats/cpu_usage/total_usage": {},
              "/intel/docker/*/*/*/stats/cgroups/memory_stats/usage/usage": {},
              "/intel/docker/*/*/*/stats/connection/tcp/*": {},
              "/intel/docker/*/*/*/stats/filesystem/*/available": {},
              "/intel/docker/*/*/*/stats/filesystem/*/capacity": {},
              "/intel/docker/*/*/*/stats/filesystem/*/reads_completed": {},
              "/intel/docker/*/*/*/stats/filesystem/*/usage": {},
              "/intel/docker/*/*/*/stats/filesystem/*/writes_completed": {},
              "/intel/docker/*/*/*/stats/network/*/rx_bytes": {},
              "/intel/docker/*/*/*/stats/network/*/tx_bytes": {},
              "/intel/procfs/cpu/all/*": {},
              "/intel/procfs/meminfo/mem_available": {},
              "/intel/procfs/meminfo/mem_available_perc": {},
              "/intel/procfs/meminfo/mem_free": {},
              "/intel/procfs/meminfo/mem_free_perc": {},
              "/intel/procfs/meminfo/mem_total": {},
              "/intel/procfs/meminfo/mem_total_perc": {},
              "/intel/procfs/meminfo/mem_used": {},
              "/intel/procfs/meminfo/mem_used_perc": {},
              "/intel/procfs/iface/*/bytes_recv": {},
              "/intel/procfs/iface/*/bytes_sent": {},
              "/intel/procfs/iface/*/packets_recv": {},
              "/intel/procfs/iface/*/packets_sent": {},
              "/intel/procfs/iface/*/errs_recv": {},
              "/intel/procfs/iface/*/errs_sent": {},
              "/intel/iostat/device/*/%util": {},
              "/intel/iostat/device/*/rkB_per_sec": {},
              "/intel/iostat/device/*/wkB_per_sec": {},
              "/intel/iostat/device/ALL/r_per_sec": {},
              "/intel/iostat/device/ALL/w_per_sec": {},
              "/intel/procfs/load/min1_rel": {}
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
                "prefix_tags": "",
                "prefix": "",
                "server": "",
                "port": 2003
              }
            }]
          }
        }
      };
      kubestateSnapTask = {
        "version": 1,
        "start": true,
        "schedule": {
          "type": "simple",
          "interval": "10s"
        },
        "max-failures": 10,
        "workflow": {
          "collect": {
            "metrics": {
              "/grafanalabs/kubestate/*": {}
            },
            "process": null,
            "publish": [{
              "plugin_name": "graphite",
              "config": {
                "prefix_tags": "",
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
              "daemon": "snapd",
              "app": "snap-collector"
            }
          },
          "template": {
            "metadata": {
              "name": "snap",
              "labels": {
                "daemon": "snapd",
                "app": "snap-collector"
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
                "image": raintankSnapImage,
                "command": ["/usr/local/bin/start.sh"],
                "args": ["/opt/snap/sbin/snapteld"],
                "ports": [{
                  "name": "snap-api",
                  "hostPort": 8282,
                  "containerPort": 8282,
                  "protocol": "TCP"
                }],
                "livenessProbe": {
                  "exec": {
                    "command": ["/bin/bash", "-c", "/opt/snap/bin/snaptel task list |grep Disabled | awk 'BEGIN {err = 0} length($1) > 0 { err = 1} END {exit err}'"]
                  },
                  initialDelaySeconds: 60
                },
                "env": [{
                  "name": "PROCFS_MOUNT",
                  "value": "/proc_host"
                }, {
                  "name": "NODE_NAME",
                  "valueFrom": {
                    "fieldRef": {
                      "fieldPath": "spec.nodeName"
                    }
                  }
                }, {
                  "name": "SNAP_PORT",
                  "value": "8282"
                }, {
                  "name": "SNAP_URL",
                  "value": "http://localhost:8282"
                }, {
                  "name": "SNAP_LOG_LEVEL",
                  "value": "3"
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
      kubestate = {
        "kind": "Deployment",
        "apiVersion": "extensions/v1beta1",
        "metadata": {
          "name": "snap-kubestate-deployment",
          "namespace": "kube-system"
        },
        "spec": {
          "replicas": 1,
          "template": {
            "metadata": {
              labels: {
                "app": "snap-collector"
              }
            },
            "spec": {
              "volumes": [{
                "name": "snap-tasks",
                "configMap": {
                  "name": "snap-tasks-kubestate"
                }
              }],
              "containers": [{
                "name": "snap",
                "image": raintankSnapImage,
                "ports": [{
                  "name": "snap-api",
                  "hostPort": 8383,
                  "containerPort": 8383,
                  "protocol": "TCP"
                }],
                "livenessProbe": {
                  "exec": {
                    "command": ["/bin/bash", "-c", "/opt/snap/bin/snaptel task list |grep Disabled | awk 'BEGIN {err = 0} length($1) > 0 { err = 1} END {exit err}'"]
                  },
                  initialDelaySeconds: 60
                },
                "env": [{
                  "name": "SNAP_PORT",
                  "value": "8383"
                }, {
                  "name": "SNAP_URL",
                  "value": "http://localhost:8383"
                }, {
                  "name": "SNAP_LOG_LEVEL",
                  "value": "3"
                }],
                "resources": {},
                "volumeMounts": [{
                  "name": "snap-tasks",
                  "mountPath": "/opt/snap/tasks"
                }],
                "imagePullPolicy": "IfNotPresent"
              }],
              "restartPolicy": "Always"
            }
          }
        }
      };
    }
  };
});
//# sourceMappingURL=clusterConfig.js.map
