/* global require */

require.config({
	baseUrl: 'scripts',
	shim: {
		'angular' : {'exports' : 'angular'}
	},
	paths: {
		angular: '../bower_components/angular/angular.min'
	}
});

require(['popupmodel'], function(PopupModel)
{
	'use strict';

	var popupModel = PopupModel.Create();
	popupModel.bootstrap();
});
