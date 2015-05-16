	/**
	 * A primitive, but powerful, HashMap
	 */
	var Dictionary = function ()
	{
		this.keys = [];
		this.values = [];
	}
	// Dictionary.toString = function ()
	// {
		// return '[Dictionary Class]';
	// }

	/**
	 * Get the value stored at a given key.
	 */
	Dictionary.prototype.get = function (key)
	{
		var index = this.keys.indexOf(key);
		if (index != -1)
		{
			return this.values[index];
		}

		return undefined;
	}

	/**
	 * Get the key for a given value.
	 * (this is the opposite of the usual use-case)
	 */
	Dictionary.prototype.getKey = function (value)
	{
		var index = this.values.indexOf(value);

		if (index != -1)
		{
			return this.keys[index];
		}
		return undefined;
	}

	/**
	 * Store the value for a given key.
	 */
	Dictionary.prototype.set = function (key, value)
	{
		var index = this.keys.indexOf(key);
		if (index == -1)
		{
				this.keys.push(key);
				index = this.keys.length - 1;
		}

		this.values[index] = value;
	}

	/**
	 * Remove the value stored for a given key.
	 */
	Dictionary.prototype.remove = function (key)
	{
		var index = this.keys.indexOf(key);
		if (index == -1)
		{
				return undefined;
		}

		var value = this.values[index];

		delete(this.values[index]);
		delete(this.keys[index]);

		return value;
	}
	
	/**
	 * Run the action function once for each value in the Dictionary.
	 * @param {Function} action - a function to call
	 * @param {Object} that - the value of "this" when calling action
	 * The action function's parameter signature is:
	 * that.action(value, key, dictionaryInstance);
	 */
	Dictionary.prototype.forEach= function(action, that) {
		for (var i= 0, len= this.keys.length; i<len; i++)
		{
			if (i in this.keys)
					action.call(that, this.values[i], this.keys[i], this);
		}
	}

	module.exports = Dictionary;