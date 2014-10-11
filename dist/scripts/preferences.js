/* global define */

define([], function()
{
	'use strict';

	function Preferences()
	{
		this.displayInlineData = true;
	}

	Preferences.prototype.Equals = function(other)
	{
		return other !== null && other.displayInlineData === this.displayInlineData;
	};

	return {
		Create: function()
			{
				return new Preferences();
			},

		CreateFromDTO: function(dto)
			{
				var prefs = new Preferences();
				prefs.displayInlineData = dto.displayInlineData;
				return prefs;
			}
	};
});
