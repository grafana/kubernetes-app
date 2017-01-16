export class ConfigCtrl {
  /** @ngInject */
  constructor($scope, $injector, $q) {
    this.$q = $q;
    this.enabled = false;
    this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
  }

  postUpdate() {
    if (!this.appModel.enabled) {
      return this.$q.resolve();
    }
    return this.appEditCtrl.importDashboards().then(() => {
      this.enabled = true;
      return {
        url: "plugins/raintank-kubernetes-app/page/clusters",
        message: "Kubernetes App enabled!"
      };
    });
  }
}
ConfigCtrl.templateUrl = 'components/config/config.html';
