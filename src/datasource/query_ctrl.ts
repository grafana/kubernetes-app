import _ from 'lodash';
import { QueryCtrl } from 'grafana/app/plugins/sdk';

export class K8sQueryCtrl extends QueryCtrl {
  static templateUrl = 'datasource/partials/query.editor.html';

  defaults = {};

  /** @ngInject */
  constructor($scope, $injector) {
    super($scope, $injector);

    _.defaultsDeep(this.target, this.defaults);

    this.target.target = this.target.target || '';
    this.target.type = this.target.type || 'timeserie';
  }

  getOptions(query) {
    return this.datasource.metricFindQuery('');
  }

  onChangeInternal() {
    this.panelCtrl.refresh(); // Asks the panel to refresh data.
  }
}
