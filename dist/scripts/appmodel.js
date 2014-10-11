/* global define */
/* global angular */

define(['config', 'fogbugz'], function(Config, FogBugzService)
{
	'use strict';

	function AppModel()
	{
		this.angularApp = null;
		this.injector = null;
		this.injectedLinkPairs = [];
		this.injectedElements = [];
		this.detached = false;
		
		this.config = Config.Create(true);

		var appModel = this;
		this.config.AddLocationChangeListener(function(url)
			{
				appModel.detached = true;
				appModel.DetachUI();
			});
		this.config.AddAuthenticationChangeListener(function(token)
			{
				appModel.detached = false;
				appModel.UpdateUI();
			});
		this.config.AddPreferencesChangeListener(function(prefs)
			{
				appModel.detached = true;
				appModel.DetachUI();
				appModel.detached = false;
				appModel.UpdateUI();
			});
	}

	AppModel.prototype.bootstrap = function()
	{
		var appModel = this;
		
		angular
			.module('fogbugz', [])
			.factory('fogbugzClient', ['$http', function($http)
				{
					return FogBugzService.Create(appModel.config, $http);
				}]);

		angular
			.module('caseinfo', ['fogbugz'])
			.controller('CaseInfoController', ['fogbugzClient', '$scope', '$timeout', function(fogbugzClient, $scope, $timeout)
				{
					this.caseNumber = $scope.caseNumber;
					$scope.caseTitle = "";
					fogbugzClient.getCaseData($scope.caseNumber, function(data)
						{
							$timeout(function()
								{
									$scope.$apply(function()
										{
											$scope.caseTitle = data.title;
										});
								}, 0);
						});
				}]);

		angular
			.module('casepopover', ['fogbugz', 'ui.bootstrap'])
			.controller('CasePopoverController', ['fogbugzClient', '$scope', '$timeout', function(fogbugzClient, $scope, $timeout)
				{
					$scope.caseTitle = "";
					$scope.caseContent = "";
					fogbugzClient.getCaseData($scope.caseNumber, function(data)
						{
							$timeout(function()
								{
									$scope.$apply(function()
										{
											$scope.caseTitle = data.title;
											$scope.caseContent = "Priority: " + data.Priority + " - " + data.milestone + " - " + data.assigned;
										});
								}, 0);
						});
				}]);

		var app = angular.module('bugflow', ['caseinfo', 'casepopover']);
		this.angularApp = app;

		var chat = document.getElementById('chat');

		app.directive('linkTemplate', function()
			{
				return {
					restrict: 'EA',
					replace: true,
					template: '<div ng-controller="CaseInfoController as case"><alert type="success">Case {{case.caseNumber}}: {{caseTitle}}</alert></div>'
				};
			});

		this.injector = angular.bootstrap(chat, ['bugflow'], []);
	};

	AppModel.prototype.UpdateUI = function()
	{
		if (this.detached)
			return;

		var appModel = this;

		var chat = document.getElementById('chat');
		if (chat === null)
		{
			return;
		}
		else if (appModel.angularApp === null)
		{
			appModel.bootstrap();
		}
		
		if (appModel.config.authToken === null)
			return;

		var liElements = chat.getElementsByTagName('li');
		for (var i = 0; i < liElements.length; i++)
		{
			var contentDivElements = liElements[i].getElementsByTagName('div');
			for (var j = 0; j < contentDivElements.length; j++)
			{
				var bodyDivElements = contentDivElements[j].getElementsByTagName('div');
				for (var k = 0; k < bodyDivElements.length; k++)
				{
					var aElements = bodyDivElements[k].getElementsByTagName('a');
					for (var r = 0; r < aElements.length; r++)
					{
						var a = aElements[r];
						var link = a.getAttribute("href");
						var processed = a.getAttribute("bugflowproc");
						if (!processed)
							a.setAttribute("bugflowproc", "yep");
						else
							continue;
						
						if (link && link.indexOf("fogbugz") > -1)
						{
							var regex = /.*fogbugz.*\?(\d+).*/;
							var match = link.match(regex);
							var caseNumber = match ? match[1] : null;
							if (!caseNumber)
								continue;

							var parameterScopeSpan = document.createElement('span');
							parameterScopeSpan.setAttribute('ng-init', "caseNumber='" + caseNumber + "'; caseLink='" + link + "';");

							var hover = document.createElement('a');
							hover.setAttribute('ng-init', "caseNumber='" + caseNumber + "'; caseLink='" + link + "';");
							hover.setAttribute('ng-controller', 'CasePopoverController');
							hover.setAttribute('popover-trigger', "mouseenter");
							hover.setAttribute('popover', "{{caseContent}}");
							hover.setAttribute('popover-title', "{{caseTitle}}");
							hover.setAttribute('popover-append-to-body', 'true');
							hover.setAttribute('href', "{{caseLink}}");
							hover.innerHTML = "Case {{caseNumber}}";

							parameterScopeSpan.appendChild(hover);
							appModel.injectedLinkPairs.push([parameterScopeSpan, a]);
							a.parentNode.replaceChild(parameterScopeSpan, a);

							var parameterScopeDiv = null;
							if (appModel.config.preferences && appModel.config.preferences.displayInlineData)
							{
								parameterScopeDiv = document.createElement('div');
								parameterScopeDiv.setAttribute('ng-init', "caseNumber='" + caseNumber + "';");

								var view = document.createElement('div');
								view.setAttribute('link-template', '');
								parameterScopeDiv.appendChild(view);

								bodyDivElements[k].appendChild(parameterScopeDiv);
								appModel.injectedElements.push(parameterScopeDiv);
							}

							appModel.injector.invoke(function($rootScope, $compile)
								{
									$compile(parameterScopeSpan)($rootScope);
									if (parameterScopeDiv)
										$compile(parameterScopeDiv)($rootScope);
								});
						}
					}
				}
			}
		}
	};

	AppModel.prototype.DetachUI = function()
	{
		for (var i = 0; i < this.injectedLinkPairs.length; i++)
		{
			var pair = this.injectedLinkPairs[i];
			pair[1].removeAttribute('bugflowproc');
			pair[0].parentNode.replaceChild(pair[1], pair[0]);
		}

		for (var i = 0; i < this.injectedElements.length; i++)
		{
			var element = this.injectedElements[i];
			element.parentNode.removeChild(element);
		}

		this.injectedLinkPairs = [];
		this.injectedElements = [];
	};

	return {
		Create: function()
			{
				return new AppModel();
			}
	};
});