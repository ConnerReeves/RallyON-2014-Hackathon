(function () {
	Ext.define('ChartColors', {
		lightBlue: '#BDD7EA',
		lightGreen: '#CADDA3',
		lightGrey: '#E6E6E6',
		darkGrey: '#666'
	});

	Ext.define('DonutChartTransformer', {
		colors: null, // set later
		stateColors: null, // set later

		transformStore: function(store) {
			var data = this._mapStoreToData(store);
			return this.transform(data);
		},

		_mapStoreToData: function(store) {
			return _.map(store.data.items, function(model) {
				return model.data;
			});
		},

		transform: function(data) {
			this._setChartColors();
			return this._runTransform(data);
		},

		_setChartColors: function() {
			var colors = Ext.create('ChartColors');
			this.colors = colors;
			this.stateColors = {
				'Defined': colors.lightBlue,
				'In-Progress': colors.lightBlue,
				'Completed': colors.lightBlue,
				'Accepted': colors.lightGreen,
				'Released': colors.lightGreen,
				'__default__': colors.lightGrey
			};
		},

		_runTransform: function(data) {
			var iterations = this._transformToIterations(data);
			var stories = this._transformToStories(data);
			return [{
				iterations: iterations,
				stories: stories
			}];
		},

		_transformToIterations: function(data) {
			var self = this;
			var iterationMap = _.reduce(data, function(result, row, index) {
				if (row.Iteration) {
					self._addStoryWithIteration(result, row);
				} else {
					self._addStoryWithoutIteration(result, row);
				}
				return result;
			}, {});

			return _.map(iterationMap, function(row) {
				return row;
			});
		},

		_addStoryWithIteration: function(result, row) {
			if (row.Iteration._ref in result) {
				result[row.Iteration._ref].y += 1;
			} else {
				var map = {
					_ref: row.Iteration._ref,
					name: row.Iteration.Name,
					y: 1,
					color: '#E6E6E6'
				};
				result[row.Iteration._ref] = map;
			}
		},

		_addStoryWithoutIteration: function(result, row) {
			var name = 'None';
			if (name in result) {
				result[name].y += 1;
			} else {
				var map = {
					name: name,
					y: 1,
					color: '#E6E6E6'
				};
				result[name] = map;
			}
		},

		_transformToStories: function(data) {
			var self = this;
			return _.map(data, function(row) {
				var map = {
					FormattedID: row.FormattedID,
					Name: row.Name,
					y: 1,
					color: self._getColorForState(row)
				};
				return map;
			});
		},

		_getColorForState: function(row) {
			return (this.stateColors[row.ScheduleState]) ? this.stateColors[row.ScheduleState] : this.stateColors.__default__;
		}
	});

}());
