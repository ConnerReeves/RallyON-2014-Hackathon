(function () {
	Ext.define('DonutChartComponent', {
		extend: "Ext.Container",
		alias: "widget.donutchart",
		flex: 1,
		config: {
			chartElemId: 'donut-chart',
			portfolioItemOid: null
		},

		html: '<div id="donut-chart"></div>',

		initComponent: function() {
			this.callParent(arguments);
			// this.query();
		},

		update: function(store) {
			this._onQueryComplete(store, null, null);
		},

		query: function() {
			var storeConfig = this._buildQueryConfig();
			storeConfig.listeners = {
				load: this._onQueryComplete,
				scope: this
			};
			var store = Ext.create('Rally.data.lookback.SnapshotStore', storeConfig);
			store.load();
		},

		_buildQueryConfig: function() {
			return {
				find: {
					'_TypeHierarchy': { $in : [ 'Defect', 'HierarchicalRequirement' ] },
					'_ItemHierarchy': this.getPortfolioItemOid(),
					'__At': 'current'
				},
				fetch: ['ScheduleState', 'PlanEstimate', 'ObjectID', 'FormattedID', 'Name', 'Iteration'],
				hydrate: ["ScheduleState"],
				sort: {
					"_ValidFrom": 1
				}
			};
		},

		_onQueryComplete: function(store, data, success) {
			var transformer = Ext.create('DonutChartTransformer');
			var data = transformer.transformStore(store);
			this._visualize(data);
		},

		_visualize: function(data) {
			var chartConfig = this._buildVisualizeConfig();
			chartConfig.series[0].data = data[0].iterations;
			chartConfig.series[1].data = data[0].stories;
			var chartElemId = '#' + this.getChartElemId();
			$(chartElemId).highcharts(chartConfig);
		},

		_buildVisualizeConfig: function() {
			return {
				type: 'pie',
				title: { text: 'Feature Donut' },
				subtitle: {
					useHTML: true,
					text: '<span class="donut-state-legend donut-active-state-legend"></span><span class="donut-legend-label">Active</span> \
					<span class="donut-state-legend donut-done-state-legend"></span><span class="donut-legend-label">Done</span>',
					y: 40
				},
				credits: { enabled: false },
				colors: [
				],
				series: [
					{
						type:'pie',
						name: 'Story Count',
						data: '',
						size: '80%',
						dataLabels:
						{
							distance: 25,
							color: 'black',
							connectorColor: '#666',
							style: {
								fontWeight: 'bold'
							}
						}
					},
					{
						type:'pie',
						name: 'Stories, etc.',
						data: '',
						size: '70%',
						innerSize: '85%',
						dataLabels: { enabled: false }
					}
				],
				tooltip: {
					formatter:  this._tooltipFormatter,
					valuePrefix: "Count: "
				},
				plotOptions: {
					pie: {
						shadow: false,
						center: ['50%', '50%'],
						point: {
							events: {
								click: function(e) {
									if (this._ref) {
										console.log("Iteration clicked: " + this._ref);
									}
								}
							}
						}
					}
				}

			};
		},

		_tooltipFormatter: function() {
			if (this.point.FormattedID) {
				return this.point.FormattedID + ': ' + this.point.Name;
			}
			return this.point.name;
		}

	});

}());