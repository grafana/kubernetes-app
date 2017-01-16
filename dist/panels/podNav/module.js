'use strict';

System.register(['./podNav', 'app/plugins/sdk'], function (_export, _context) {
  "use strict";

  var PodNavCtrl, loadPluginCss;
  return {
    setters: [function (_podNav) {
      PodNavCtrl = _podNav.PodNavCtrl;
    }, function (_appPluginsSdk) {
      loadPluginCss = _appPluginsSdk.loadPluginCss;
    }],
    execute: function () {

      loadPluginCss({
        dark: 'plugins/raintank-kubernetes-app/css/dark.css',
        light: 'plugins/raintank-kubernetes-app/css/light.css'
      });

      _export('PanelCtrl', PodNavCtrl);
    }
  };
});
//# sourceMappingURL=module.js.map
