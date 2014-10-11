/* global chrome */

'use strict';

chrome.runtime.onInstalled.addListener(function(details)
	{
		console.log('previousVersion', details.previousVersion);
	});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab)
	{
		if (tab.url.indexOf("flowdock.com/app") > 0)
			chrome.pageAction.show(tabId);
	});
