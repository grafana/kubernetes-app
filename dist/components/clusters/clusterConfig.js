'use strict';

System.register(['lodash', 'app/core/app_events', 'angular'], function (_export, _context) {
  "use strict";

  var _, appEvents, angular, _createClass, ClusterConfigCtrl, raintankSnapImage, configMap, kubestateConfigMap, snapTask, snapCadvisorTask, kubestateSnapTask, daemonSet, NodeExporterImage, nodeExporterDaemonSet, kubestate, prometheusImage, kubestateImage, prometheusDeployment, kubestateDeployment;

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
          this.cluster = {
            type: 'raintank-kubernetes-datasource'
          };
          this.pageReady = false;
          this.prometheusDeployed = false;
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
                return self.getDeployments().then(function (ds) {
                  _.forEach(ds.items, function (deployment) {
                    if (deployment.metadata.name === "prometheus-deployment") {
                      self.prometheusDeployed = true;
                    }
                  });
                });
              }));
            }

            promises.push(self.getPrometheusDatasources());

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
          key: 'getPrometheusDatasources',
          value: function getPrometheusDatasources() {
            var self = this;
            return this.backendSrv.get('/api/datasources').then(function (result) {
              self.datasources = _.filter(result, {
                "type": "prometheus"
              });
            });
          }
        }, {
          key: 'getDeployments',
          value: function getDeployments() {
            var self = this;
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + self.cluster.id + '/apis/apps/v1beta2/namespaces/kube-system/deployments',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
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
          key: 'savePrometheusConfigToFile',
          value: function savePrometheusConfigToFile() {
            var blob = new Blob([this.generatePrometheusConfig()], {
              type: "application/yaml"
            });
            this.saveToFile('prometheus.yml', blob);
          }
        }, {
          key: 'savePrometheusConfigMapToFile',
          value: function savePrometheusConfigMapToFile() {
            var blob = new Blob([angular.toJson(this.generatePrometheusConfigMap(), true)], {
              type: "application/json"
            });
            this.saveToFile('grafanak8s-prometheus-cm.yml', blob);
          }
        }, {
          key: 'saveNodeExporterDSToFile',
          value: function saveNodeExporterDSToFile() {
            var blob = new Blob([angular.toJson(nodeExporterDaemonSet, true)], {
              type: "application/json"
            });
            this.saveToFile('grafanak8s-node-exporter-ds.json', blob);
          }
        }, {
          key: 'saveKubeStateDeployToFile',
          value: function saveKubeStateDeployToFile() {
            var blob = new Blob([angular.toJson(kubestateDeployment, true)], {
              type: "application/json"
            });
            this.saveToFile('grafanak8s-kubestate-deploy.json', blob);
          }
        }, {
          key: 'saveToFile',
          value: function saveToFile(filename, blob) {
            var blobUrl = window.URL.createObjectURL(blob);

            var element = document.createElement('a');
            element.setAttribute('href', blobUrl);
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
          }
        }, {
          key: 'deploy',
          value: function deploy() {
            var _this2 = this;

            var question = !this.prometheusDeployed ? 'This action will deploy a DaemonSet to your Kubernetes cluster. It uses Intel Snap to collect health metrics. ' + 'Are you sure you want to deploy?' : 'This action will update the Config Map for the Snap DaemonSet and recreate the snapd pod on your Kubernetes cluster. ' + 'Are you sure you want to deploy?';
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
                _this3.undeployPrometheus();
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
              return _this4.deployPrometheus();
            });
          }
        }, {
          key: 'generateConfigMap',
          value: function generateConfigMap() {
            var task = _.cloneDeep(snapTask);
            task.workflow.collect.publish[0].config.prefix = "snap." + slugify(this.cluster.name) + ".<%NODE%>";
            task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
            task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
            var cadvisor_task = _.cloneDeep(snapCadvisorTask);
            cadvisor_task.workflow.collect.publish[0].config.prefix = "snap." + slugify(this.cluster.name) + ".<%NODE%>";
            cadvisor_task.workflow.collect.publish[0].config.port = this.cluster.jsonData.port;
            cadvisor_task.workflow.collect.publish[0].config.server = this.cluster.jsonData.server;
            var cm = _.cloneDeep(configMap);
            cm.data["core.json"] = JSON.stringify(task);
            cm.data["cadvisor.json"] = JSON.stringify(cadvisor_task);
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

            if (!this.prometheusDeployed) {
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
                _this5.prometheusDeployed = true;
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
              _this6.prometheusDeployed = false;
              _this6.alertSrv.set("Daemonset removed", "Snap DaemonSet for Kubernetes metrics removed from " + self.cluster.name, 'success', 5000);
            });
          }
        }, {
          key: 'checkApiVersion',
          value: function checkApiVersion(clusterId) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
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
              headers: {
                'Content-Type': 'application/json'
              }
            });
          }
        }, {
          key: 'createDaemonSet',
          value: function createDaemonSet(clusterId, daemonSet) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/daemonsets',
              method: 'POST',
              data: daemonSet,
              headers: {
                'Content-Type': "application/json"
              }
            });
          }
        }, {
          key: 'deleteDaemonSet',
          value: function deleteDaemonSet(clusterId) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/daemonsets/node-exporter',
              method: 'DELETE'
            });
          }
        }, {
          key: 'createDeployment',
          value: function createDeployment(clusterId, deployment) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/deployments',
              method: 'POST',
              data: deployment,
              headers: {
                'Content-Type': "application/json"
              }
            });
          }
        }, {
          key: 'deleteDeployment',
          value: function deleteDeployment(clusterId, deploymentName) {
            var _this7 = this;

            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/deployments/' + deploymentName,
              method: 'DELETE'
            }).then(function () {
              return _this7.backendSrv.request({
                url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta2/namespaces/kube-system/replicasets?labelSelector=grafanak8sapp%3Dtrue',
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
              url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/pods?labelSelector=grafanak8sapp%3Dtrue',
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            }).then(function (pods) {
              if (!pods || pods.items.length === 0) {
                throw "No pods found to update.";
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
          key: 'createService',
          value: function createService(clusterId, service) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/services',
              method: 'POST',
              data: service,
              headers: {
                'Content-Type': "application/json"
              }
            });
          }
        }, {
          key: 'deleteService',
          value: function deleteService(clusterId) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/api/v1/namespaces/kube-system/services/node-exporter',
              method: 'DELETE',
              headers: {
                'Content-Type': "application/json"
              }
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
        }, {
          key: 'deployPrometheus',
          value: function deployPrometheus() {
            var _this10 = this;

            var self = this;
            if (!this.cluster || !this.cluster.id) {
              this.alertSrv.set("Error", "Could not connect to cluster.", 'error');
              return;
            }
            return this.checkApiVersion(self.cluster.id).then(function () {
              return _this10.createConfigMap(self.cluster.id, _this10.generatePrometheusConfigMap());
            }).catch(function (err) {
              _this10.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this10.createDeployment(self.cluster.id, kubestateDeployment);
            }).catch(function (err) {
              _this10.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this10.createDaemonSet(self.cluster.id, nodeExporterDaemonSet);
            }).catch(function (err) {
              _this10.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this10.createDeployment(self.cluster.id, prometheusDeployment);
            }).catch(function (err) {
              _this10.alertSrv.set("Error", err, 'error');
            }).then(function () {
              _this10.prometheusDeployed = true;
              _this10.alertSrv.set("Deployed", "Snap DaemonSet for Kubernetes metrics deployed to " + self.cluster.name, 'success', 5000);
            });
          }
        }, {
          key: 'undeployPrometheus',
          value: function undeployPrometheus() {
            var _this11 = this;

            var self = this;
            return this.deleteConfigMap(self.cluster.id, 'prometheus-configmap').then(function () {
              return _this11.deleteDeployment(self.cluster.id, 'kube-state-metrics');
            }).catch(function (err) {
              _this11.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this11.deleteDeployment(self.cluster.id, 'prometheus-deployment');
            }).catch(function (err) {
              _this11.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this11.deleteDaemonSet(self.cluster.id);
            }).catch(function (err) {
              _this11.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this11.deletePods();
            }).catch(function (err) {
              _this11.alertSrv.set("Error", err, 'error');
            }).then(function () {
              _this11.prometheusDeployed = false;
              _this11.alertSrv.set("Daemonset removed", "Snap DaemonSet for Kubernetes metrics removed from " + self.cluster.name, 'success', 5000);
            });
          }
        }, {
          key: 'generatePrometheusConfig',
          value: function generatePrometheusConfig() {
            return 'scrape_configs:\n- job_name: \'kubernetes-kubelet\'\n  scheme: https\n  tls_config:\n    ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt\n    insecure_skip_verify: true\n  bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token\n  kubernetes_sd_configs:\n  - role: node\n  relabel_configs:\n  - action: labelmap\n    regex: __meta_kubernetes_node_label_(.+)\n  - target_label: __address__\n    replacement: kubernetes.default.svc:443\n  - source_labels: [__meta_kubernetes_node_name]\n    regex: (.+)\n    target_label: __metrics_path__\n    replacement: /api/v1/nodes/${1}/proxy/metrics\n  - source_labels: [__address__]\n    regex: .*\n    target_label: kubernetes_cluster\n    replacement: ' + this.cluster.name + '\n- job_name: \'kubernetes-cadvisor\'\n  scheme: https\n  tls_config:\n    ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt\n    insecure_skip_verify: true\n  bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token\n  kubernetes_sd_configs:\n  - role: node\n  relabel_configs:\n  - action: labelmap\n    regex: __meta_kubernetes_node_label_(.+)\n  - target_label: __address__\n    replacement: kubernetes.default.svc:443\n  - source_labels: [__meta_kubernetes_node_name]\n    regex: (.+)\n    target_label: __metrics_path__\n    replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor\n  - source_labels: [__address__]\n    regex: .*\n    target_label: kubernetes_cluster\n    replacement: ' + this.cluster.name + '\n- job_name: \'kubernetes-nodes\'\n  scheme: https\n  tls_config:\n    ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt\n    insecure_skip_verify: true\n  bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token\n  kubernetes_sd_configs:\n  - role: node\n  relabel_configs:\n  - action: labelmap\n    regex: __meta_kubernetes_node_label_(.+)\n  - target_label: __address__\n    replacement: kubernetes.default.svc:443\n  - source_labels: [__meta_kubernetes_node_name]\n    regex: (.+)\n    target_label: __metrics_path__\n    replacement: /api/v1/nodes/${1}/proxy/metrics\n  - source_labels: [__address__]\n    regex: .*\n    target_label: kubernetes_cluster\n    replacement: ' + this.cluster.name + '\n- job_name: \'kubernetes-pods\'\n  kubernetes_sd_configs:\n  - role: pod\n  relabel_configs:\n  - action: labelmap\n    regex: __meta_kubernetes_pod_label_(.+)\n  - source_labels: [__meta_kubernetes_namespace]\n    action: replace\n    target_label: kubernetes_namespace\n  - source_labels: [__meta_kubernetes_pod_name]\n    action: replace\n    target_label: kubernetes_pod_name\n  - source_labels: [__meta_kubernetes_pod_label_grafanak8sapp]\n    regex: .*true.*\n    action: keep\n  - source_labels: [__address__]\n    regex: .*\n    target_label: kubernetes_cluster\n    replacement: ' + this.cluster.name + '\n  - source_labels: [__meta_kubernetes_pod_node_name]\n    action: replace\n    target_label: instance';
          }
        }, {
          key: 'generatePrometheusConfigMap',
          value: function generatePrometheusConfigMap() {
            return {
              "apiVersion": "v1",
              "kind": "ConfigMap",
              "metadata": {
                "name": "prometheus-configmap"
              },
              "data": {
                "prometheus.yml": this.generatePrometheusConfig
              }
            };
          }
        }]);

        return ClusterConfigCtrl;
      }());

      _export('ClusterConfigCtrl', ClusterConfigCtrl);

      ClusterConfigCtrl.templateUrl = 'components/clusters/partials/cluster_config.html';

      raintankSnapImage = 'raintank/snap_k8s:v23';
      configMap = {
        "kind": "ConfigMap",
        "apiVersion": "v1",
        "metadata": {
          "name": "snap-tasks",
          "namespace": "kube-system"
        },
        "data": {
          "core.json": "",
          "cadvisor.json": ""
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
              "/intel/procfs/cpu/all/*": {},
              "/intel/procfs/meminfo/mem_available": {},
              "/intel/procfs/meminfo/mem_available_perc": {},
              "/intel/procfs/meminfo/mem_free": {},
              "/intel/procfs/meminfo/mem_free_perc": {},
              "/intel/procfs/meminfo/mem_total": {},
              "/intel/procfs/meminfo/mem_total_perc": {},
              "/intel/procfs/meminfo/mem_used": {},
              "/intel/procfs/meminfo/mem_used_perc": {},
              "/intel/procfs/filesystem/*/inodes_free": {},
              "/intel/procfs/filesystem/*/inodes_reserved": {},
              "/intel/procfs/filesystem/*/inodes_used": {},
              "/intel/procfs/filesystem/*/space_free": {},
              "/intel/procfs/filesystem/*/space_reserved": {},
              "/intel/procfs/filesystem/*/space_used": {},
              "/intel/procfs/filesystem/*/inodes_percent_free": {},
              "/intel/procfs/filesystem/*/inodes_percent_reserved": {},
              "/intel/procfs/filesystem/*/inodes_percent_used": {},
              "/intel/procfs/filesystem/*/space_percent_free": {},
              "/intel/procfs/filesystem/*/space_percent_reserved": {},
              "/intel/procfs/filesystem/*/space_percent_used": {},
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
                "proc_path": "/proc_host",
                "keep_original_mountpoint": false
              }
            },
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
      snapCadvisorTask = {
        "version": 1,
        "start": true,
        "schedule": {
          "type": "streaming"
        },
        "workflow": {
          "collect": {
            "metrics": {
              "/grafanalabs/cadvisor/container/*/*/*/cpu/total/usage": {},
              "/grafanalabs/cadvisor/container/*/*/*/mem/usage": {},
              "/grafanalabs/cadvisor/container/*/*/*/fs/*": {},
              "/grafanalabs/cadvisor/container/*/*/*/diskio/*": {},
              "/grafanalabs/cadvisor/container/*/*/*/iface/*/out_bytes": {},
              "/grafanalabs/cadvisor/container/*/*/*/iface/*/in_bytes": {},
              "/grafanalabs/cadvisor/container/*/*/*/tcp/*": {},
              "/grafanalabs/cadvisor/container/*/*/*/tcp6/*": {}
            },
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
      NodeExporterImage = 'quay.io/prometheus/node-exporter:v0.15.0';
      nodeExporterDaemonSet = {
        "kind": "DaemonSet",
        "apiVersion": "apps/v1beta2",
        "metadata": {
          "name": "node-exporter",
          "namespace": "kube-system"
        },
        "spec": {
          "selector": {
            "matchLabels": {
              "daemon": "node-exporter",
              "grafanak8sapp": "true"
            }
          },
          "template": {
            "metadata": {
              "name": "node-exporter",
              "labels": {
                "daemon": "node-exporter",
                "grafanak8sapp": "true"
              }
            },
            "spec": {
              "volumes": [{
                "name": "proc",
                "hostPath": {
                  "path": "/proc"
                }
              }, {
                "name": "sys",
                "hostPath": {
                  "path": "/sys"
                }
              }],
              "containers": [{
                "name": "node-exporter",
                "image": NodeExporterImage,
                "args": ["--path.procfs=/proc_host", "--path.sysfs=/host_sys"],
                "ports": [{
                  "name": "node-exporter",
                  "hostPort": 9100,
                  "containerPort": 9100
                }],
                "volumeMounts": [{
                  "name": "sys",
                  "readOnly": true,
                  "mountPath": "/host_sys"
                }, {
                  "name": "proc",
                  "readOnly": true,
                  "mountPath": "/proc_host"
                }],
                "imagePullPolicy": "IfNotPresent"
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
              "labels": {
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
      prometheusImage = 'prom/prometheus:v2.0.0';
      kubestateImage = 'quay.io/coreos/kube-state-metrics:v1.1.0';
      prometheusDeployment = {
        "apiVersion": "apps/v1beta2",
        "kind": "Deployment",
        "metadata": {
          "name": "prometheus-deployment",
          "namespace": "kube-system"
        },
        "spec": {
          "replicas": 1,
          "strategy": {
            "rollingUpdate": {
              "maxSurge": 0,
              "maxUnavailable": 1
            },
            "type": "RollingUpdate"
          },
          "selector": {
            "matchLabels": {
              "app": "prometheus",
              "grafanak8sapp": "true"
            }
          },
          "template": {
            "metadata": {
              "name": "prometheus",
              "labels": {
                "app": "prometheus",
                "grafanak8sapp": "true"
              }
            },
            "spec": {
              "containers": [{
                "name": "prometheus",
                "image": prometheusImage,
                "args": ['--config.file=/etc/prometheus/prometheus.yml'],
                "ports": [{
                  "name": "web",
                  "containerPort": 9090
                }],
                "env": [],
                "volumeMounts": [{
                  "name": "config-volume",
                  "mountPath": "/etc/prometheus"
                }]
              }],
              "volumes": [{
                "name": "config-volume",
                "configMap": {
                  "name": "prometheus-configmap"
                }
              }]
            }
          }
        }
      };
      kubestateDeployment = {
        "apiVersion": "apps/v1beta2",
        "kind": "Deployment",
        "metadata": {
          "name": "kube-state-metrics",
          "namespace": "kube-system"
        },
        "spec": {
          "selector": {
            "matchLabels": {
              "k8s-app": "kube-state-metrics",
              "grafanak8sapp": "true"
            }
          },
          "replicas": 1,
          "template": {
            "metadata": {
              "labels": {
                "k8s-app": "kube-state-metrics",
                "grafanak8sapp": "true"
              }
            },
            "spec": {
              "containers": [{
                "name": "kube-state-metrics",
                "image": kubestateImage,
                "ports": [{
                  "name": "http-metrics",
                  "containerPort": 8080
                }],
                "readinessProbe": {
                  "httpGet": {
                    "path": "/healthz",
                    "port": 8080
                  },
                  "initialDelaySeconds": 5,
                  "timeoutSeconds": 5
                }
              }]
            }
          }
        }
      };
    }
  };
});
//# sourceMappingURL=clusterConfig.js.map
