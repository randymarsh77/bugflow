/* global define */

define(['angular', 'config', 'fogbugz', 'preferences'], function(angular, Config, FogBugzService, Preferences)
{
	'use strict';

	function PopupModel()
	{
		this.angularApp = null;
		this.authToken = null;
		this.config = Config.Create(false);
	}

	PopupModel.prototype.bootstrap = function()
	{
		var popupModel = this;

		angular
			.module('fogbugz', [])
			.factory('fogbugzClient', ['$http', function($http)
				{
					return FogBugzService.Create(popupModel.config, $http);
				}]);

		angular
			.module('usercontroller', ['fogbugz'])
			.controller('UserController', ['fogbugzClient', '$scope', '$timeout', function(fogbugzClient, $scope, $timeout)
				{
					var controller = this;

					this.fogbugzurl = popupModel.config.fogBugzBaseUrl;
					this.inline = popupModel.config.preferences.displayInlineData;
					$scope.hasUrl = this.fogbugzurl !== null;

					this.authToken = popupModel.config.authToken;
					$scope.isAuthenticated = this.authToken !== null;

					this.setServiceUrl = function()
						{
							popupModel.config.SetFogBugzServiceAuthenticationCookie(null);
							popupModel.config.SetFogBugzServiceLocationCookie(this.fogbugzurl === "" ? null : this.fogbugzurl);
						};

					this.changeServiceUrl = function()
						{
							$scope.isAuthenticated = false;
							$scope.hasUrl = false;
						};

					this.login = function()
						{
							fogbugzClient.authenticate(controller.username, controller.password, function(dto)
								{
									if (dto.token)
										popupModel.config.SetFogBugzServiceAuthenticationCookie(dto.token);
								});
						};

					this.updatePreferences = function()
						{
							var newPreferences = Preferences.Create();
							newPreferences.displayInlineData = controller.inline;

							popupModel.config.SetPreferencesCookie(newPreferences);
						};

					popupModel.config.AddLocationChangeListener(function(fogBugzUrl)
						{
							$timeout(function()
								{
									$scope.$apply(function()
										{
											$scope.hasUrl = fogBugzUrl !== null;
											$scope.fogBugzUrl = fogBugzUrl;
										});
								}, 0);
						});

					popupModel.config.AddAuthenticationChangeListener(function(token)
						{
							$timeout(function()
								{
									$scope.$apply(function()
										{
											$scope.isAuthenticated = token !== null;
										});
								}, 0);

							if (token === null)
							{
								$timeout(function()
									{
										$scope.$apply(function()
											{
												$scope.userFullName = "";
											});
									}, 0);
							}
							else
							{
								fogbugzClient.getUser(null, function(data)
									{
										$timeout(function()
											{
												$scope.$apply(function()
													{
														$scope.userFullName = data.name;
													});
											}, 0);
									});
							}

							popupModel.config.SetFogBugzServiceAuthenticationCookie(token);
						});

					popupModel.config.AddPreferencesChangeListener(function(preferences)
						{
							$timeout(function()
								{
									$scope.$apply(function()
										{
											controller.inline = preferences === null || preferences.displayInlineData;
										});
								}, 0);
						});
				}]);

		var app = angular.module('bugflowpopup', ['usercontroller']);
		this.angularApp = app;
	};

	return {
		Create: function()
		{
			return new PopupModel();
		}
	};
});