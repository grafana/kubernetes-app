import { PodNavCtrl } from './podNav';
import { loadPluginCss } from 'grafana/app/plugins/sdk';

loadPluginCss({
  dark: 'plugins/grafana-kubernetes-app/css/dark.css',
  light: 'plugins/grafana-kubernetes-app/css/light.css',
});

export { PodNavCtrl as PanelCtrl };
