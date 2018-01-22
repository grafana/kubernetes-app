'use strict';

System.register(['lodash', 'app/core/app_events', 'angular'], function (_export, _context) {
  "use strict";

  var _, appEvents, angular, _createClass, ClusterConfigCtrl, nodeExporterImage, kubestateImage, kubestateDeployment, nodeExporterDaemonSet;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
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
          this.showPrometheusExample = false;
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
          key: 'togglePrometheusExample',
          value: function togglePrometheusExample() {
            this.showPrometheusExample = !this.showPrometheusExample;
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
              // self.hostedMetricsDS = _.filter(result, obj =>
              //   /grafana.net\/(graphite|prometheus)$/.test(obj.url)
              // );
              console.log(self.hostedMetricsDS);
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
              url: 'api/datasources/proxy/' + self.cluster.id + '/apis/apps/v1beta1/namespaces/kube-system/deployments',
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

            var question = !this.prometheusDeployed ? 'This action will deploy Prometheus exporters to your Kubernetes cluster.' + 'Are you sure you want to deploy?' : 'This action will update the Prometheus exporters on your Kubernetes cluster. ' + 'Are you sure you want to deploy?';
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
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets',
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
              url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/daemonsets/node-exporter',
              method: 'DELETE'
            });
          }
        }, {
          key: 'createDeployment',
          value: function createDeployment(clusterId, deployment) {
            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta1/namespaces/kube-system/deployments',
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
            var _this5 = this;

            return this.backendSrv.request({
              url: 'api/datasources/proxy/' + clusterId + '/apis/apps/v1beta1/namespaces/kube-system/deployments/' + deploymentName,
              method: 'DELETE'
            }).then(function () {
              return _this5.backendSrv.request({
                url: 'api/datasources/proxy/' + clusterId + '/apis/extensions/v1beta1/namespaces/kube-system/replicasets?labelSelector=grafanak8sapp%3Dtrue',
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
            var _this6 = this;

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
                promises.push(_this6.backendSrv.request({
                  url: 'api/datasources/proxy/' + self.cluster.id + '/api/v1/namespaces/kube-system/pods/' + pod.metadata.name,
                  method: 'DELETE'
                }));
              });

              return _this6.$q.all(promises);
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
            var _this7 = this;

            var self = this;
            if (!this.cluster || !this.cluster.id) {
              this.alertSrv.set("Error", "Could not connect to cluster.", 'error');
              return;
            }
            return this.checkApiVersion(self.cluster.id).then(function () {
              return _this7.createDeployment(self.cluster.id, kubestateDeployment);
            }).catch(function (err) {
              _this7.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this7.createDaemonSet(self.cluster.id, nodeExporterDaemonSet);
            }).catch(function (err) {
              _this7.alertSrv.set("Error", err, 'error');
            }).then(function () {
              _this7.prometheusDeployed = true;
              _this7.alertSrv.set("Deployed", "Prometheus and exporters have been deployed to " + self.cluster.name, 'success', 5000);
            });
          }
        }, {
          key: 'undeployPrometheus',
          value: function undeployPrometheus() {
            var _this8 = this;

            var self = this;
            return this.checkApiVersion(self.cluster.id).then(function () {
              return _this8.deleteDeployment(self.cluster.id, 'kube-state-metrics');
            }).catch(function (err) {
              _this8.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this8.deleteDaemonSet(self.cluster.id);
            }).catch(function (err) {
              _this8.alertSrv.set("Error", err, 'error');
            }).then(function () {
              return _this8.deletePods();
            }).catch(function (err) {
              _this8.alertSrv.set("Error", err, 'error');
            }).then(function () {
              _this8.prometheusDeployed = false;
              _this8.alertSrv.set("Grafana K8s removed", "Prometheus and exporters removed from " + self.cluster.name, 'success', 5000);
            });
          }
        }, {
          key: 'generatePrometheusConfig',
          value: function generatePrometheusConfig() {
            return 'scrape_configs:\n- job_name: \'kubernetes-kubelet\'\n  scheme: https\n  tls_config:\n    ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt\n    insecure_skip_verify: true\n  bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token\n  kubernetes_sd_configs:\n  - role: node\n  relabel_configs:\n  - action: labelmap\n    regex: __meta_kubernetes_node_label_(.+)\n  - target_label: __address__\n    replacement: kubernetes.default.svc:443\n  - source_labels: [__meta_kubernetes_node_name]\n    regex: (.+)\n    target_label: __metrics_path__\n    replacement: /api/v1/nodes/${1}/proxy/metrics\n  - source_labels: [__address__]\n    regex: .*\n    target_label: kubernetes_cluster\n    replacement: ' + this.cluster.name + '\n- job_name: \'kubernetes-cadvisor\'\n  scheme: https\n  tls_config:\n    ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt\n    insecure_skip_verify: true\n  bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token\n  kubernetes_sd_configs:\n  - role: node\n  relabel_configs:\n  - action: labelmap\n    regex: __meta_kubernetes_node_label_(.+)\n  - target_label: __address__\n    replacement: kubernetes.default.svc:443\n  - source_labels: [__meta_kubernetes_node_name]\n    regex: (.+)\n    target_label: __metrics_path__\n    replacement: /api/v1/nodes/${1}/proxy/metrics/cadvisor\n  - source_labels: [__address__]\n    regex: .*\n    target_label: kubernetes_cluster\n    replacement: ' + this.cluster.name + '\n- job_name: \'kubernetes-kube-state\'\n  kubernetes_sd_configs:\n  - role: pod\n  relabel_configs:\n  - action: labelmap\n    regex: __meta_kubernetes_pod_label_(.+)\n  - source_labels: [__meta_kubernetes_namespace]\n    action: replace\n    target_label: kubernetes_namespace\n  - source_labels: [__meta_kubernetes_pod_name]\n    action: replace\n    target_label: kubernetes_pod_name\n  - source_labels: [__meta_kubernetes_pod_label_grafanak8sapp]\n    regex: .*true.*\n    action: keep\n  - source_labels: [__address__]\n    regex: .*\n    target_label: kubernetes_cluster\n    replacement: ' + this.cluster.name + '\n  - source_labels: [\'__meta_kubernetes_pod_label_daemon\', \'__meta_kubernetes_pod_node_name\']\n    regex: \'node-exporter;(.*)\'\n    action: replace\n    target_label: nodename';
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
                "prometheus.yml": this.generatePrometheusConfig()
              }
            };
          }
        }]);

        return ClusterConfigCtrl;
      }());

      _export('ClusterConfigCtrl', ClusterConfigCtrl);

      ClusterConfigCtrl.templateUrl = 'components/clusters/partials/cluster_config.html';

      nodeExporterImage = 'quay.io/prometheus/node-exporter:v0.15.0';
      kubestateImage = 'quay.io/coreos/kube-state-metrics:v1.1.0';
      kubestateDeployment = {
        "apiVersion": "apps/v1beta1",
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
      nodeExporterDaemonSet = {
        "kind": "DaemonSet",
        "apiVersion": "extensions/v1beta1",
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
                "image": nodeExporterImage,
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
    }
  };
});
//# sourceMappingURL=clusterConfig.js.map
