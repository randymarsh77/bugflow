/* global define */

define(['RMCookieJar', 'preferences'], function(CookieJar, Preferences)
{
	'use strict';

	function Config(useLocalDataSource)
	{
		this.useLocalDataSource = useLocalDataSource;
		this.flowDockCookieURL = "https://www.flowdock.com/";
		this.cookieJar = CookieJar.Create();
		this.fogBugzBaseUrl = null;
		this.authToken = null;
		this.preferences = Preferences.Create();
		this.locationChangedListeners = [];
		this.authenticationChangedListeners = [];
		this.preferencesChangedListeners = [];
		this.locationCookieListener = null;
		this.authenticationCookieListener = null;
		this.preferencesCookieListener = null;
	}

	Config.prototype.AddLocationChangeListener = function(callback)
	{
		this.locationChangedListeners.push(callback);
	};

	Config.prototype.AddAuthenticationChangeListener = function(callback)
	{
		this.authenticationChangedListeners.push(callback);
	};

	Config.prototype.AddPreferencesChangeListener = function(callback)
	{
		this.preferencesChangedListeners.push(callback);
	};

	Config.prototype.SetFogBugzServiceLocationCookie = function(value)
	{
		var cookieName = "fbServiceUrl";
		if (value !== null)
		{
			this.cookieJar.SetCookie(this.flowDockCookieURL, cookieName, value);
		}
		else
		{
			this.cookieJar.RemoveCookie(this.flowDockCookieURL, cookieName);
		}
	};

	Config.prototype.SetFogBugzServiceAuthenticationCookie = function(value)
	{
		var cookieName = "fbToken";
		if (value !== null)
		{
			this.cookieJar.SetCookie(this.flowDockCookieURL, cookieName, value);
		}
		else
		{
			this.cookieJar.RemoveCookie(this.flowDockCookieURL, cookieName);
		}
	};

	Config.prototype.SetPreferencesCookie = function(value)
	{
		var cookieName = "bfPrefs";
		if (value !== null)
		{
			this.cookieJar.SetCookie(this.flowDockCookieURL, cookieName, JSON.stringify(value));
		}
		else
		{
			this.cookieJar.RemoveCookie(this.flowDockCookieURL, cookieName);
		}
	};

	Config.prototype.SetFogBugzServiceLocation = function(url)
	{
		if (this.fogBugzBaseUrl === url)
			return;

		this.fogBugzBaseUrl = url;
		for (var i = 0; i < this.locationChangedListeners.length; i++)
			this.locationChangedListeners[i](this.fogBugzBaseUrl);

		this.InitializeFogBugzServiceAuthentication();
	};

	Config.prototype.SetFogBugzServiceAuthentication = function(token)
	{
		if (this.authToken === token)
			return;

		this.authToken = token;
		for (var i = 0; i < this.authenticationChangedListeners.length; i++)
			this.authenticationChangedListeners[i](this.authToken);

		this.InitializePreferences();
	};

	Config.prototype.SetPreferences = function(preferences)
	{
		if (this.preferences !== null && this.preferences.Equals(preferences) || this.preferences === null && preferences === null)
			return;

		this.preferences = preferences;
		for (var i = 0; i < this.preferencesChangedListeners.length; i++)
			this.preferencesChangedListeners[i](this.preferences);
	};

	Config.prototype.InitializeFogBugzServiceData = function()
	{
		var config = this;
		var cookieName = "fbServiceUrl";

		if (this.locationCookieListener !== null)
			config.cookieJar.RemoveCookieListener(this.locationCookieListener);

		config.cookieJar.GetCookie(this.flowDockCookieURL, cookieName, function(value)
			{
				config.SetFogBugzServiceLocation(value);
			});

		this.locationCookieListener = config.cookieJar.AddCookieListener(this.flowDockCookieURL, cookieName, function(changeInfo)
			{
				config.SetFogBugzServiceLocation(changeInfo.removed ? null : changeInfo.cookie.value);
			});
	};

	Config.prototype.InitializeFogBugzServiceAuthentication = function()
	{
		var config = this;
		var cookieName = "fbToken";
		var authCookieUrl = this.useLocalDataSource ? this.flowDockCookieURL : this.fogBugzBaseUrl;
		if (!authCookieUrl)
			return;

		if (this.authenticationCookieListener !== null)
			config.cookieJar.RemoveCookieListener(this.authenticationCookieListener);

		config.cookieJar.GetCookie(authCookieUrl, cookieName, function(value)
			{
				config.SetFogBugzServiceAuthentication(value);
			});

		this.authenticationCookieListener = config.cookieJar.AddCookieListener(authCookieUrl, cookieName, function(changeInfo)
			{
				if (changeInfo.cause && changeInfo.cause === 'overwrite')
					return;

				config.SetFogBugzServiceAuthentication(changeInfo.removed ? null : changeInfo.cookie.value);
			});
	};

	Config.prototype.InitializePreferences = function()
	{
		var config = this;
		var cookieName = "bfPrefs";

		if (this.preferencesCookieListener !== null)
			config.cookieJar.RemoveCookieListener(this.preferencesCookieListener);

		config.cookieJar.GetCookie(this.flowDockCookieURL, cookieName, function(value)
			{
				config.SetPreferences(Preferences.CreateFromDTO(JSON.parse(value)));
			});

		this.preferencesCookieListener = config.cookieJar.AddCookieListener(this.flowDockCookieURL, cookieName, function(changeInfo)
			{
				config.SetPreferences(changeInfo.removed ? null : Preferences.CreateFromDTO(JSON.parse(changeInfo.cookie.value)));
			});
	};

	return {
		Create: function(useLocalDataSource)
			{
				var config = new Config(useLocalDataSource);
				config.InitializeFogBugzServiceData();
				return config;
			}
	};
});
