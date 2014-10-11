/* global define */
/* global chrome */
/* global escape */
/* global unescape */

define([], function()
{
	'use strict';

	function LocalCookieListener(cookieJar, cookieName, callback)
	{
		this.cookieJar = cookieJar;
		this.cookieName = cookieName;
		this.callback = callback;
		this.cookieRegistry = {};

		var listener = this;
		this.interval = setInterval(function()
			{
				listener.cookieJar.GetCookie(null, listener.cookieName, function(cookieVal)
				{
					var status =
						listener.cookieRegistry[listener.cookieName] === null && cookieVal !== null ? LocalCookieListener.prototype.CREATED :
						listener.cookieRegistry[listener.cookieName] !== null && cookieVal === null ? LocalCookieListener.prototype.DELETED :
						cookieVal !== listener.cookieRegistry[listener.cookieName] ? LocalCookieListener.prototype.UPDATED :
						LocalCookieListener.prototype.UNCHANGED;

					listener.cookieRegistry[listener.cookieName] = cookieVal;

					if (status !== LocalCookieListener.prototype.UNCHANGED)
					{
						var changeInfo = {
							removed : status === LocalCookieListener.prototype.DELETED,
							cookie : {
								name : listener.cookieName,
								value : cookieVal
							}
						};

						listener.callback(changeInfo);
					}
				});	
			}, 500);
	}

	LocalCookieListener.prototype.CREATED = 'created';
	LocalCookieListener.prototype.DELETED = 'deleted';
	LocalCookieListener.prototype.UPDATED = 'updated';
	LocalCookieListener.prototype.UNCHANGED = 'unchanged';

	LocalCookieListener.prototype.Dispose = function()
	{
		clearInterval(this.interval);
	};

	function RMCookieJar()
	{
		this.localCookieListeners = [];
	}

	RMCookieJar.prototype.GetCookie = function(url, name, callback)
	{
		var cookieDetails = {
			url: url,
			name: name
		};

		if (chrome.cookies)
		{
			chrome.cookies.get(cookieDetails, function(cookie)
				{
					callback(cookie.value);
				});
		}
		else
		{
			var value = this._DocumentGetCookie(cookieDetails.name);
			callback(value);
		}
	};

	RMCookieJar.prototype.SetCookie = function(url, name, value)
	{
		var details = {
			url: url,
			name: name,
			value: value
		};

		if (chrome.cookies)
		{
			chrome.cookies.set(details);
		}
		else
		{
			this._DocumentSetCookie(details.name, details.value, 99);
		}
	};

	RMCookieJar.prototype.RemoveCookie = function(url, name)
	{
		if (!chrome.cookies)
		{
			console.log("Not supported");
			return;
		}

		var details = {
			url: url,
			name: name
		};

		chrome.cookies.remove(details, function(result)
			{
				if (result !== null)
					console.log("cookie removed: " + details.name);
			});
	};

	RMCookieJar.prototype.AddCookieListener = function(url, name, callback)
	{
		var listenerCallback = function(changeInfo)
			{
				if (changeInfo.cookie && changeInfo.cookie.name === name)
					callback(changeInfo);
			};

		var listener = listenerCallback;

		if (!chrome.cookies)
		{
			listener = new LocalCookieListener(this, name, listenerCallback);
			this.localCookieListeners.push(listener);
		}
		else
		{
			chrome.cookies.onChanged.addListener(listenerCallback);
		}

		return listener;
	};

	RMCookieJar.prototype.RemoveCookieListener = function(listener)
	{
		if (!chrome.cookies)
		{
			listener.Dispose();
			var index = this.localCookieListeners.indexOf(listener);
			if (index > -1)
				this.localCookieListeners.splice(index, 1);
		}
		else
		{
			chrome.cookies.onChanged.removeListener(listener);
		}
	};

	RMCookieJar.prototype._DocumentSetCookie = function(c_name, value, exdays)
	{
		var exdate=new Date();
		exdate.setDate(exdate.getDate() + exdays);
		var c_value = escape(value) + ((exdays === null) ? "" : ("; expires=" + exdate.toUTCString()));
		document.cookie=c_name + "=" + c_value;
	};

	RMCookieJar.prototype._DocumentGetCookie = function(c_name)
	{
		var i,x,y,ARRcookies=document.cookie.split(";");
		for (i=0;i<ARRcookies.length;i++)
		{
			x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
			y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
			x=x.replace(/^\s+|\s+$/g,"");
			if (x === c_name)
				return unescape(y);
		}
	};

	return {
		Create: function()
			{
				return new RMCookieJar();
			}
	};
});

