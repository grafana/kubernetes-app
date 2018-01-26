///<reference path="../../node_modules/grafana-sdk-mocks/app/headers/common.d.ts" />
System.register(['./datasource'], function(exports_1) {
    var datasource_1;
    var K8sConfigCtrl;
    return {
        setters:[
            function (datasource_1_1) {
                datasource_1 = datasource_1_1;
            }],
        execute: function() {
            K8sConfigCtrl = (function () {
                function K8sConfigCtrl() {
                }
                K8sConfigCtrl.templateUrl = 'datasource/config.html';
                return K8sConfigCtrl;
            })();
            exports_1("Datasource", datasource_1.K8sDatasource);
            exports_1("ConfigCtrl", K8sConfigCtrl);
        }
    }
});
//# sourceMappingURL=module.js.map