export class ConfigCtrl {
  /** @ngInject */
  constructor($scope, $injector, $q) {
    this.$q = $q;
    this.appEditCtrl.setPostUpdateHook(this.postUpdate.bind(this));
  }

  postUpdate() {
    if (!this.appModel.enabled) {
      return this.$q.resolve();
    }
    return this.appEditCtrl.importDashboards().then(() => {
      return {
        url: "plugins/raintank-kubernetes-app/page/clusters",
        message: "Kubernetes App enabled!"
      };
    });
  }
}
ConfigCtrl.templateUrl = 'components/config/config.html';
