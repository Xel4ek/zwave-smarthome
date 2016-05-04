/**
 * @overview Controllers that handle all Skins actions.
 * @author Martin Vach
 */

/**
 * This is the Skin root controller
 * @class SkinBaseController
 *
 */
myAppController.controller('SkinBaseController', function ($scope, $q, $cookies, dataFactory, _) {
    $scope.skins = {
        local: {
            all: {},
            find: {},
            active: $scope.cfg.skin.active,
            show: false
        },
        online: {
            all: {},
            find: {},
            ids: {},
            show: false
        },
        installed: {
            all: {}
        }
    };

//    /**
//     * Get active skin
//     */
//    $scope.getActiveSkin = function () {
//        if ($cookies.skin && $cookies.skin !== 'default') {
//            $scope.skins.local.active = $cookies.skin;
//        }
//    };
//    $scope.getActiveSkin();


    /**
     * Load all promises
     */
    $scope.allSettled = function () {
        $scope.loading = {status: 'loading-spin', icon: 'fa-spinner fa-spin', message: $scope._t('loading')};
        var promises = [
            dataFactory.getApiLocal('skins.json'),
            dataFactory.getRemoteData($scope.cfg.online_skin_url)
        ];

        $q.allSettled(promises).then(function (response) {
            // console.log(response)
            var localSkins = response[0];
            var onlineSkins = response[1];
            // Error message
            if (localSkins.state === 'rejected' || onlineSkins.state === 'rejected') {
                alertify.alertError($scope._t('error_load_data'));
            }
            // Success - local skins
            if (localSkins.state === 'fulfilled') {
                setLocalSkins(localSkins.value.data.data);
            }

            // Success - online skins
            if (onlineSkins.state === 'fulfilled') {
                setOnlineSkins(onlineSkins.value.data.data);
            }

            $scope.loading = false;

        });

    };
    $scope.allSettled();

    /// --- Private functions --- ///

    /**
     * Set local skins $scope
     * @param {object} response
     * @returns {undefined}
     */
   function setLocalSkins(response) {
        $scope.skins.local.all = _.chain(response)
                .flatten()
                .filter(function (v) {
                    // Set icon path
                    var iconPath = v.name !== 'default' ? $scope.cfg.skin.path + v.name : $scope.cfg.img.skin_screenshot;
                    v.icon = (!v.icon ? 'storage/img/placeholder-img.png' : iconPath + '/screenshot.png');
                    return v;
                })
                .indexBy('name')
                .value();
        ;
        $scope.skins.local.show = true;
    };

    /**
     * Set online skins $scope
     * @param {object} response
     * @returns {undefined}
     */
    function setOnlineSkins(response) {
        $scope.skins.online.all = _.chain(response)
                .flatten()
                .filter(function (v) {
                    // Set skin download path
                    v.download = $scope.cfg.online_skin_storage + v.file;
                    // Set icon path
                    v.icon = (v.icon == '' ? 'storage/img/placeholder-img.png' : $scope.cfg.online_skin_storage + v.icon);
                    // Set status
                    v.status = 'download';
                    if ($scope.skins.local.all[v.name]) {
                        v.status = 'installed';
                        // Compare local and online versions
                        if ($scope.skins.local.all[v.name].version !== v.version) {
                            var localVersion = $scope.skins.local.all[v.name].version.toString().split('.'),
                                onlineVersion = v.version.toString().split('.');

                            for (var i = 0; i < localVersion.length; i++) {
                                if ((parseInt(localVersion[i], 10) < parseInt(onlineVersion[i], 10)) || ((parseInt(localVersion[i], 10) <= parseInt(onlineVersion[i], 10)) && (!localVersion[i + 1] && onlineVersion[i + 1] && parseInt(onlineVersion[i + 1], 10) > 0))) {
                                   v.status = 'upgrade';
                                    break;
                                }
                            }
                        }
                    }
                    return v;
                })
                .indexBy('name')
                .value();
        ;
        $scope.skins.online.show = true;
    };

});

/**
 * This controller handles local skins actions.
 * @class SkinLocalController
 *
 */
myAppController.controller('SkinLocalController', function ($scope, $window, $route, $timeout, $cookies, dataFactory, dataService) {
    $scope.activeTab = 'local';

    /**
     * Activate skin
     */
    $scope.activateSkin = function (skin) {
        //$scope.loading = {status: 'loading-spin', icon: 'fa-spinner fa-spin', message: $scope._t('updating')};

        dataFactory.getApiLocal('skins-online.json').then(function (response) {
            $cookies.skin = skin.name;
            dataService.showNotifier({message: $scope._t('success_updated')});
            //return;
            $timeout(function () {
                $scope.loading = {status: 'loading-spin', icon: '--', message: $scope._t('reloading_page')};
                alertify.dismissAll();
                $window.location.reload();
            }, 2000);
            $scope.loading = false;
        }, function (error) {
            $scope.loading = false;
            alertify.alertError($scope._t('error_update_data'));
        });
    };


    /**
     * Remove skin
     */
    $scope.removeSkin = function (skin, message) {
        alertify.confirm(message, function () {
            $scope.loading = {status: 'loading-spin', icon: 'fa-spinner fa-spin', message: $scope._t('deleting')};
            dataFactory.getApiLocal('skins-online.json').then(function (response) {
                delete $scope.skins.local.all[skin.name];
                $scope.loading = false;
                dataService.showNotifier({message: $scope._t('delete_successful')});

                //$route.reload();
            }, function (error) {
                $scope.loading = false;
                alertify.alertError($scope._t('error_delete_data'));
            });
        });
    };
});
/**
 * This controller handles online skins actions.
 * @class SkinOnlineController
 *
 */
myAppController.controller('SkinOnlineController', function ($scope, $timeout, dataFactory, dataService) {
    $scope.activeTab = 'online';

    /**
     * Download skin
     */
    $scope.downloadSkin = function (skin) {
        console.log(skin)
        $scope.loading = {status: 'loading-spin', icon: 'fa-spinner fa-spin', message: $scope._t('downloading')};
        dataFactory.getApiLocal('skins-online.json').then(function (response) {
            $timeout(function () {
                $scope.loading = false;
                dataService.showNotifier({message: $scope._t('success_file_download')});
            }, 2000);
        }, function (error) {
            $scope.loading = false;
            alertify.alertError($scope._t('error_file_download'));
        });

    };

    /**
     * Upgrade skin
     */
    $scope.upgradeSkin = function (skin) {
        $scope.loading = {status: 'loading-spin', icon: 'fa-spinner fa-spin', message: $scope._t('downloading')};

        dataFactory.getApiLocal('skins-online.json').then(function (response) {
            $timeout(function () {
                $scope.loading = false;
                dataService.showNotifier({message: $scope._t('success_file_download')});
            }, 2000);
        }, function (error) {
            $scope.loading = false;
            alertify.alertError($scope._t('error_file_download'));
        });
    };
});