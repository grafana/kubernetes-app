
import {PodNavCtrl} from './podNav';
import {loadPluginCss} from 'app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/prometheus-kubernetes-app/css/dark.css',
  light: 'plugins/prometheus-kubernetes-app/css/light.css'
});

export  {
  PodNavCtrl as PanelCtrl
};
