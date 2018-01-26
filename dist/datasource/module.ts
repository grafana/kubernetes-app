///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />

import {K8sDatasource} from './datasource';

class K8sConfigCtrl {
  static templateUrl = 'datasource/config.html'; 
}

export {
  K8sDatasource as Datasource,
  K8sConfigCtrl as ConfigCtrl
};