/* global require */
/* global chrome */

require.config({
	baseUrl: chrome.extension.getURL("/scripts"),
});

require(['appmodel'], function(AppModel)
{
	'use strict';

	var appModel = AppModel.Create();

	window.addEventListener("DOMSubtreeModified", function()
		{
			appModel.UpdateUI();	
		});
});
