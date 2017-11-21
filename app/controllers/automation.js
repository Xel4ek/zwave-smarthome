/**
 * @overview Controllers that handle automation actions – scenes, rules, schedules.
 * @author Martin Vach
 */

/**
 * Aoutomation parent controller
 * @class AutomationController
 */
myAppController.controller('AutomationController', function ($scope,  $routeParams,$location, cfg, dataFactory, dataService, _, myCache) {
    $scope.automation = {
        moduleId: $routeParams.moduleId,
        allowedIds: ['LightScene', 'IfThen', 'ScheduledScene'],
        /* icons: {
            LightScene: 'scene.png', 
            IfThen: 'security-pending.png', 
            ScheduledScene: 'alarm.png'
        }, */
        prototypeRoutes: {
            LightScene: 'scenes', 
            IfThen: 'rules', 
            ScheduledScene: 'schedules'
        }, 
        imgPath: cfg.server_url + cfg.api_url + 'load/modulemedia/',
        state: '',
        localModules: {},
        instances: {
            all: []
           
        }
    };

    /**
     * Load local modules
     * @returns {undefined}
     */
    $scope.loadLocalModules = function () {
        dataFactory.getApi('modules').then(function (response) {
            // Get info from module
            _.filter(response.data.data, function (v) {
                if ($scope.automation.allowedIds.indexOf(v.moduleName) > -1) {
                    $scope.automation.localModules[v.moduleName] = {
                        version: v.version,
                        icon: $scope.automation.imgPath + v.id + '/' + v.icon,
                        //icon: cfg.img.icons + $scope.automation.icons[v.moduleName],
                        singleton: v.singleton,
                        title: v.defaults.title
                    };

                }

            });
        });
    };
    

    /**
     * Load instances
     * @returns {undefined}
     */
    $scope.loadInstances = function (moduleId) {
        dataFactory.getApi('instances', null, true).then(function (response) {
            $scope.automation.instances.all = _.where(response.data.data, {
                moduleId: moduleId
            });
            if(!_.size($scope.automation.instances.all)){
                $scope.automation.state = 'blank';
                return;
            }
            $scope.automation.state = 'success';
        }, function (error) {
            alertify.alertError($scope._t('error_load_data'));
        });
    };
    if ($scope.automation.allowedIds.indexOf($routeParams.moduleId) > -1) {
        $scope.loadLocalModules();
        $scope.loadInstances($routeParams.moduleId);
    }else{
        $location.path('/error403');
    }


    /**
     * Activate instance
     */
    $scope.activateInstance = function (input, activeStatus) {
        input.active = activeStatus;
        if (input.id) {
            dataFactory.putApi('instances', input.id, input).then(function (response) {
                $scope.loading = false;

            }, function (error) {
                alertify.alertError($scope._t('error_update_data'));
                $scope.loading = false;
            });
        }

    };

    /**
     * Delete instance
     */
    $scope.deleteInstance = function (input, message) {
        alertify.confirm(message, function () {
            dataFactory.deleteApi('instances', input.id).then(function (response) {
                dataService.showNotifier({
                    message: $scope._t('delete_successful')
                });
                $scope.reloadData();
            }, function (error) {
                alertify.alertError($scope._t('error_delete_data'));
            });

        });
    };

});

/**
 * Aoutomation scene controller
 * @class AutomationSceneController
 */
myAppController.controller('AutomationSceneController', function ($scope,  $routeParams,$location, cfg, dataFactory, dataService, _, myCache) {
    $scope.scene = {
      input:{},
        rooms : [],
        modules: {
            switches: {
                title: 'Switches',
                all: ['Dummy Binary Switch','Everspring Switch 1','Everspring Switch 2','POPP Switch 1','POPP Switch 2']
            },
            dimmers: {
                title: 'Dimmers',
                all: ['Dimmer 1','Dimmer 2']
            },
            thermostats: {
                title: 'Thermostats',
                all: ['Thermostat 1','Thermostat 2','Thermostat 3']
            },
            locks: {
                title: 'Locks',
                all: ['Lock 1']
            },
            scenes: {
                title: 'Scenes',
                all: ['Scene 1','Scene 2','Scene 3','Scene 4']
            }
        }
       
        
    }

    /**
     * Load locations
     */
    $scope.loadLocations = function () {
        dataFactory.getApi('locations').then(function (response) {
            $scope.scene.rooms = dataService.getRooms(response.data.data).value();
        }, function (error) {});
    };
    $scope.loadLocations();
});