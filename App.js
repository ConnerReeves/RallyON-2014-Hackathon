Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    activeFeatureIndex : 0,
    selectedFeatures   : [],

    activeChartIndex : 0,

    layout: 'border',
    launch: function() {
        //Reload process
        Deft.Chain.pipeline([
            function() {
                this.add([{
                    region: 'north',
                    minWidth: 300,
                    layout: 'hbox',
                    items: [{
                        xtype: 'button',
                        cls: 'icon-btn',
                        height: 29,
                        width: 41,
                        margin: '2 2 2 2',
                        text: '<span class="icon-chevron-left icon-large"></span>',
                        handler: function() {
                            this.activeFeatureIndex--;
                            this._updateActiveFeature();
                        },
                        scope: this
                    },{
                        xtype: 'button',
                        cls: 'icon-btn',
                        height: 29,
                        width: 41,
                        margin: '2 2 2 2',
                        text: '<span class="icon-chevron-right icon-large"></span>',
                        handler: function() {
                            this.activeFeatureIndex++;
                            this._updateActiveFeature();
                        },
                        scope: this
                    },{
                        xtype: 'container',
                        id: 'activeFeatureInfoContainer',
                        margin: '0 0 0 10',
                        html: '<span class="icon-spinner icon-large icon-spin"></span>'
                    },{
                        xtype: 'component',
                        flex: 1
                    },{
                        xtype: 'button',
                        cls: 'icon-btn',
                        height: 29,
                        width: 41,
                        margin: '2 2 2 2',
                        text: '<span class="icon-gear icon-large"></span>',
                        arrowCls: '',
                        menu: {
                            xtype: 'menu',
                            plain: true,
                            items: [{
                                text: '<span class="icon-plus icon-large"></span> Add Features',
                                handler: function() {
                                    Ext.create('Rally.ui.dialog.ChooserDialog', {
                                        title               : 'Choose Features to Add',
                                        selectionButtonText : 'Save',
                                        artifactTypes       : ['portfolioItem/Feature'],
                                        autoShow            : true,
                                        multiple            : true,
                                        model               : true,
                                        height              : 510,
                                        width               : 700,
                                        movable             : true,
                                        columns             : [{
                                            dataIndex : 'FormattedID',
                                            maxWidth  : 65
                                        },{
                                            dataIndex : 'Name',
                                            flex      : 1
                                        }],
                                        storeConfig : {
                                            pageSize : 20000,
                                            sorters: [{
                                                property  : 'FormattedID',
                                                direction : 'ASC'
                                            }]
                                        },
                                        gridConfig: {
                                            showPagingToolbar : false,
                                            margin            : '5 0 11 0',
                                            style             : {
                                                borderBottom: '2px solid #888888'
                                            }
                                        },
                                        listeners: {
                                            artifactChosen: function(records) {
                                                if (records.length > 0) {
                                                    this.selectedFeatures = _.sortBy(_.values(_.indexBy(this.selectedFeatures.concat(_.pluck(records, 'data')), function(data) {
                                                        return data.ObjectID;
                                                    })), 'FormattedID');

                                                    this._saveSelectedFeatures();
                                                    this._updateActiveFeature();
                                                } else {
                                                    Ext.Msg.alert('Error', 'No Features chosen.');
                                                }
                                            },
                                            scope: this
                                        }
                                    });
                                },
                                scope: this
                            },{
                                text: '<span class="icon-minus icon-large"></span> Remove Features',
                                handler: function() {
                                    Ext.create('Rally.ui.dialog.ChooserDialog', {
                                        title               : 'Choose Features to Remove',
                                        selectionButtonText : 'Save',
                                        artifactTypes       : ['portfolioItem/Feature'],
                                        autoShow            : true,
                                        multiple            : true,
                                        model               : true,
                                        height              : 510,
                                        width               : 700,
                                        movable             : true,
                                        columns             : [{
                                            dataIndex : 'FormattedID',
                                            maxWidth  : 65
                                        },{
                                            dataIndex : 'Name',
                                            flex      : 1
                                        }],
                                        storeConfig : {
                                            pageSize : 20000,
                                            sorters: [{
                                                property  : 'FormattedID',
                                                direction : 'ASC'
                                            }],
                                            filters : Rally.data.QueryFilter.or(_.map(this.selectedFeatures, function(data) {
                                                return {
                                                    property : 'ObjectID',
                                                    value    : data.ObjectID
                                                };
                                            }))
                                        },
                                        gridConfig: {
                                            showPagingToolbar : false,
                                            margin            : '5 0 11 0',
                                            style             : {
                                                borderBottom: '2px solid #888888'
                                            }
                                        },
                                        listeners: {
                                            artifactChosen: function(records) {
                                                if (records.length > 0) {
                                                    var OIDsToRemove = _.map(records, function(record) {
                                                        return record.get('ObjectID');
                                                    });

                                                    this.selectedFeatures = _.sortBy(_.filter(this.selectedFeatures, function(data) {
                                                        return !_.contains(OIDsToRemove, data.ObjectID);
                                                    }), 'FormattedID');

                                                    this._saveSelectedFeatures();
                                                    this._updateActiveFeature();
                                                } else {
                                                    Ext.Msg.alert('Error', 'No Features chosen.');
                                                }
                                            },
                                            scope: this
                                        }
                                    });
                                },
                                scope: this
                            }]
                        }
                    }]
                },{
                    region : 'center',
                    layout : 'border',
                    border : false,
                    items  : [{
                        region : 'north',
                        layout : 'hbox',
                        height : 450,
                        items  : [{
                            xtype  : 'container',
                            id     : 'gridContainer',
                            flex   : 1,
                            style  : {
                                borderRight: '1px solid #D6D6D6'
                            },
                            items: [{
                                xtype             : 'rallygrid',
                                id                : 'rallygrid',
                                showPagingToolbar : false,
                                height            : 450,
                                features          : [{
                                    ftype          : 'groupingsummary',
                                    groupHeaderTpl : '{name} ({rows.length} User Stor{[values.rows.length > 1 ? "ies" : "y"]})',
                                    collapsible    : false
                                }],
                                storeConfig       : {
                                    model    : 'UserStory',
                                    pageSize : 20000,
                                    filters  : [{
                                        property : 'ObjectID',
                                        value    : -1
                                    }]
                                },
                                columnCfgs: [{
                                    dataIndex : 'FormattedID',
                                    width     : 70
                                }, 'Name', {
                                    dataIndex : 'ScheduleState',
                                    align     : 'center',
                                    width     : 70
                                },{
                                    dataIndex : 'PlanEstimate',
                                    align     : 'center',
                                    width     : 60,
                                    renderer  : function(val, meta, record) {
                                        return Math.round(val * 100) / 100;
                                    }
                                }]
                            }]
                        },{
                            xtype : 'donutchart',
                            id    : 'donut-chart-component'
                        }]
                    },{
                        region: 'center',
                        id: 'trendChartContainer'
                    }]
                }]);
            },

            function() {
                var deferred = Ext.create('Deft.Deferred');
                Rally.data.PreferenceManager.load({
                    filterByUser: true,
                    success: function(prefs) {
                        deferred.resolve(Ext.JSON.decode(prefs.selectedFeatureOIDs));
                    },
                    scope: this
                });
                return deferred.promise;
            },

            function(featureOIDs) {
                if (featureOIDs && featureOIDs.length > 0) {
                    var deferred = Ext.create('Deft.Deferred');
                    Ext.create('Rally.data.WsapiDataStore', {
                        limit   : Infinity,
                        model   : 'portfolioItem/Feature',
                        fetch   : ['ObjectID','FormattedID','Name'],
                        filters : Rally.data.QueryFilter.or(_.map(featureOIDs, function(OID) {
                            return {
                                property : 'ObjectID',
                                value    : OID
                            };
                        })),
                        sorters : [{
                            property  : 'FormattedID',
                            direction : 'ASC'
                        }]
                    }).load({
                        callback: function(records, operation, success) {
                            this.selectedFeatures = _.pluck(records, 'data');
                            this._updateActiveFeature();
                            deferred.resolve();
                        },
                        scope: this
                    });
                    return deferred.promise;
                } else {
                    Ext.getCmp('activeFeatureInfoContainer').update('Add Features...');
                }
            }
        ], this);
    },

    _updateActiveFeature: function() {
        if (this.activeFeatureUpdateProcess && this.activeFeatureUpdateProcess.getState() === 'pending') this.activeFeatureUpdateProcess.cancel();

        this.activeFeatureData = this.selectedFeatures[Math.abs(this.activeFeatureIndex) % this.selectedFeatures.length];

        //Reinitialize UI components
        Ext.getCmp('rallygrid').store.removeAll();

        if (this.activeFeatureData) {
            this.activeFeatureUpdateProcess = Deft.Chain.pipeline([
                //Update UI components
                function() {
                    Ext.getCmp('rallygrid').setLoading(true);
                    Ext.getCmp('activeFeatureInfoContainer').update(Ext.String.format('{0}: {1}', this.activeFeatureData.FormattedID, this.activeFeatureData.Name));
                },

                function() {
                    var deferred = Ext.create('Deft.Deferred');
                    Ext.create('Rally.data.WsapiDataStore', {
                        limit   : Infinity,
                        model   : 'UserStory',
                        fetch   : [
                            'FormattedID',
                            'Iteration',
                            'Name',
                            'PlanEstimate',
                            'ScheduleState',
                            'Project'
                        ],
                        filters    : [{
                            property : 'Feature.ObjectID',
                            value    : this.activeFeatureData.ObjectID
                        },{
                            property : 'DirectChildrenCount',
                            value    : 0
                        }],
                        groupField: 'Project',
                        getGroupString: function(record) {
                            return record.get('Project').Name;
                        }
                    }).load({
                        callback : function(records, operation, success) {
                            deferred.resolve(this);
                        }
                    });
                    return deferred.promise;
                }
            ], this);

            this.activeFeatureUpdateProcess.then({
                success: function(store) {
                    // Update Grid
                    Ext.getCmp('rallygrid').bindStore(store);
                    // Update donut chart
                    Ext.getCmp('donut-chart-component').update(store);
                },
                scope: this
            }).always(function() {
                Ext.getCmp('rallygrid').setLoading(false);
            });
        } else {
            Ext.getCmp('activeFeatureInfoContainer').update('Add Features...');
            Ext.getCmp('rallygrid').setLoading(false);
        }
    },

    _saveSelectedFeatures: function() {
        Rally.data.PreferenceManager.update({
            filterByUser: true,
            settings: {
                activeFeatureIndex  : this.activeFeatureIndex,
                selectedFeatureOIDs : Ext.JSON.encode(_.map(this.selectedFeatures, function(data) {
                    return data.ObjectID;
                }))
            },
            success: function() {
                Rally.ui.notify.Notifier.show({
                    message  : 'Settings saved successfully.',
                    duration : 2500
                });
            }
        });
    },

    _updateTrendCharts: function(iterationName) {
        if (this.trendChartUpdateProcess && this.trendChartUpdateProcess.getState() === 'pending') this.trendChartUpdateProcess.cancel();

        this.trendChartUpdateProcess = Deft.Chain.pipeline([
            //Get the iteration OIDs to filter by
            function() {
                var deferred = Ext.create('Deft.Deferred');

                var projectNameFilters = _.map(Ext.getCmp('rallygrid').store.groups.keys, function(groupName) {
                    return {
                        property : 'Project.Name',
                        value    : groupName
                    };
                });

                Ext.create('Rally.data.WsapiDataStore', {
                    limit   : Infinity,
                    model   : 'Iteration',
                    fetch   : ['ObjectID','StartDate','EndDate'],
                    filters : [{
                        property : 'Name',
                        value    : iterationName
                    },{
                        property : 'StartDate',
                        operator : '!=',
                        value    : null
                    },{
                        property : 'EndDate',
                        operator : '!=',
                        value    : null
                    }, Rally.data.QueryFilter.or(projectNameFilters)]
                }).load({
                    callback : function(records, operation, success) {
                        var data = _.pluck(records, 'data');

                        var queryDate  = _.min(_.pluck(data, 'StartDate'));
                        var maxDate    = _.max(_.pluck(data, 'EndDate'));
                        var queryDates = [];

                        while (queryDate <= maxDate) {
                            queryDates.push(queryDate);
                            queryDate = Ext.Date.add(queryDate, Ext.Date.DAY, 1);
                        }

                        deferred.resolve({
                            OIDs       : _.pluck(data, 'ObjectID'),
                            queryDates : queryDates
                        });
                    }
                });
                return deferred.promise;
            },

            function(iterationConfig) {
                var deferred = Ext.create('Deft.Deferred');

                Deft.Promise.all(_.map(iterationConfig.queryDates, function(queryDate) {
                    return function() {
                        var deferred = Ext.create('Deft.Deferred');
                        Ext.create('Rally.data.lookback.SnapshotStore', {
                            limit   : Infinity,
                            fetch   : ['Name','PlanEstimate','ScheduleState'],
                            hydrate : ['ScheduleState'],
                            find    : {
                                '__At'           : Rally.util.DateTime.toIsoString(queryDate),
                                '_TypeHierarchy' : 'HierarchicalRequirement',
                                'Children'       : null,
                                'Iteration'      : {
                                    '$in' : iterationConfig.OIDs
                                }
                            }
                        }).load({
                            params : {
                                compress                    : true,
                                removeUnauthorizedSnapshots : true
                            },
                            callback : function(records, operation, success) {
                                deferred.resolve({
                                    date    : Ext.Date.format(queryDate, 'Y-m-d'),
                                    records : records
                                });
                            }
                        });
                        return deferred.promise;
                    }();
                })).then({
                    success: function(snapshotSeriesData) {
                        deferred.resolve(snapshotSeriesData);
                    },
                    scope: this
                });

                return deferred.promise;
            }
        ], this);

        this.trendChartUpdateProcess.then({
            success: function(snapshotSeriesData) {
                this.snapshotSeriesData = snapshotSeriesData;
                this._drawActiveChart();
            },
            scope: this
        });
    },

    _drawActiveChart: function() {
        var chartConfigRenderFns = [
            //Cummulative Flow
            function(snapshotSeriesData) {
                return {
                    data : {
                        series : _.map(['Initial Version','Defined','In-Progress','Completed','Accepted'], function(scheduleState) {
                            return {
                                name : scheduleState,
                                data : _.map(snapshotSeriesData, function(snapshotGroup) {
                                    return _.reduce(snapshotGroup.records, function(sum, record) {
                                        return sum + (record.get('ScheduleState') === scheduleState) ? record.get('PlanEstimate') || 0 : 0;
                                    }, 0);
                                })
                            };
                        })
                    },
                    config : {
                        chart : {
                            type   : 'area',
                            height : Ext.getCmp('trendChartContainer').getHeight()
                        },
                        title: {
                            text : ''
                        },
                        xAxis: [{
                            categories : _.pluck(snapshotSeriesData, 'date'),
                            labels: {
                                rotation: -45,
                                y: 15
                            }
                        }],
                        yAxis : {
                            title : {
                                text : 'Plan Estimate Total'
                            }
                        },
                        legend : {
                            verticalAlign : 'bottom',
                            align         : 'center',
                            padding       : 5
                        },
                        tooltip : {
                            shared        : true,
                            useHTML       : true,
                            followPointer : true,
                            formatter     : function() {
                                var lineItem = this;
                                var stackTotal = 0;
                                var tooltipHTML = '<table>';
                                Ext.Array.each(lineItem.points, function(point) {
                                    tooltipHTML += '<tr style="font-size:10px;"><td width="33%" style="padding:0;text-align:right;color:' + point.series.color + ';">' + point.series.name + ':</td><td width="33%" style="text-align:center;padding:0 0 0 5px;"><b>(' + Ext.util.Format.number(point.point.y, '0,0') + ')<b></td><td width="33%" style="text-align:center;padding:0 0 0 5px;"><b>' + (parseInt(point.point.percentage * 100, 10) / 100) + '%</b></td></tr>';
                                    stackTotal  += parseInt(point.point.y, 10) || 0;
                                });
                                tooltipHTML += '<tr style="border-top:1px solid black;font-size:10px;"><td width="33%" style="padding:0;text-align:right;"><b><i>Total:</i></b></td><td width="33%" style="text-align:center;padding:0 0 0 5px;"><b>(' + Ext.util.Format.number(stackTotal, '0,0') + ')<b></td><td width="33%" style="text-align:center;padding:0 0 0 5px;"><b>100%</b></td></tr>';
                                tooltipHTML += '</table>';
                                return tooltipHTML;
                            }
                        },
                        plotOptions: {
                            area: {
                                stacking: 'normal'
                            }
                        }
                    }
                };
            }
        ];

        var chart = chartConfigRenderFns[Math.abs(this.activeChartIndex) % chartConfigRenderFns.length](this.snapshotSeriesData);

        Ext.getCmp('trendChartContainer').removeAll();
        Ext.getCmp('trendChartContainer').add({
            xtype       : 'rallychart',
            chartData   : chart.data,
            chartConfig : chart.config,
            listeners   : {
                afterrender : function() {
                    this.unmask();
                }
            }
        });
    }
});