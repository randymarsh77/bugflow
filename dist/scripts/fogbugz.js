/* global define */

define([], function()
{
	'use strict';

	function FogBugzService(config, httpFactory)
	{
		this.config = config;
		this.httpFactory = httpFactory;
		this.httpFactory.defaults.useXDomain = true;
	}

	FogBugzService.prototype.authenticate = function(username, password, onSuccess)
	{
		var request = this.config.fogBugzBaseUrl + "/api.asp?" + "cmd=logon&email=" + username + "&password=" + password;

		this.httpFactory.get(request)
			.success(function(data, status, headers, config)
				{
					var parser = new DOMParser();
					var dom = parser.parseFromString(data, "text/xml");
					var token = dom.getElementsByTagName("token").item(0).textContent;

					var dto = {
						token: token
					};

					onSuccess(dto);
				})
			.error(function(data, status, headers, config)
				{
					console.log("error");
					console.log("status: " + status);
					console.log("data: " + data);
				});
	};

	FogBugzService.prototype.constructRequest = function(cmd, params, args)
	{
		var url = this.config.fogBugzBaseUrl + "/api.asp?" + "cmd=" + cmd + "&token=" + this.config.authToken;
		for (var key in params)
		{
			if (params.hasOwnProperty(key))
				url += "&" + key + "=" + params[key];
		}
		for (var arg in args)
		{
			if (args.hasOwnProperty(arg))
				url += "&" + arg;
		}

		return url;
	};

	FogBugzService.prototype.getCaseData = function(caseId, onSuccess)
	{
		var params =  {
			"q" : caseId,
			"cols" : "sTitle,sPriority,sFixFor,sPersonAssignedTo"
		};
		var request = this.constructRequest("search", params, null);

		this.httpFactory.get(request)
			.success(function(data, status, headers, config)
				{
					var parser = new DOMParser();
					var dom = parser.parseFromString(data, "text/xml");

					var dto = {
						title: dom.getElementsByTagName("sTitle").item(0).textContent,
						priority: dom.getElementsByTagName("sPriority").item(0).textContent,
						milestone: dom.getElementsByTagName("sFixFor").item(0).textContent,
						assigned: dom.getElementsByTagName("sPersonAssignedTo").item(0).textContent
					};

					onSuccess(dto);
				})
			.error(function(data, status, headers, config)
				{
					console.log("error");
					console.log("status: " + status);
					console.log("data: " + data);
				});
	};

	FogBugzService.prototype.getUser = function(email, onSuccess)
	{
		var request = this.constructRequest("viewPerson", null, "ixPerson");

		this.httpFactory.get(request)
			.success(function(data, status, headers, config)
				{
					var parser = new DOMParser();
					var dom = parser.parseFromString(data, "text/xml");
					var name = dom.getElementsByTagName("sFullName").item(0).textContent;
					
					var dto = {
						name: name
					};
					
					onSuccess(dto);
				})
			.error(function(data, status, headers, config)
				{
					console.log("error");
					console.log("status: " + status);
					console.log("data: " + data);
				});
	};

	return {
		Create: function(config, httpFactory)
			{
				return new FogBugzService(config, httpFactory);
			}
	};
});
