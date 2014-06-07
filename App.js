Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    activeFeatureIndex : 0,
    selectedFeatures   : [],

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
                            xtype : 'container',
                            id    : 'radialContainer',
                            flex  : 1,
                            html  : 'Radial goes here...'
                        }]
                    },{
                        region: 'center',
                        html: 'Charts go here...'
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

        var activeFeatureRecord = this.selectedFeatures[Math.abs(this.activeFeatureIndex) % this.selectedFeatures.length];

        //Reinitialize UI components
        Ext.getCmp('rallygrid').store.removeAll();
        
        if (activeFeatureRecord) {
            this.activeFeatureUpdateProcess = Deft.Chain.pipeline([
                function() {
                    //Display active Feature details
                    Ext.getCmp('rallygrid').setLoading(true);
                    Ext.getCmp('activeFeatureInfoContainer').update(Ext.String.format('{0}: {1}', activeFeatureRecord.FormattedID, activeFeatureRecord.Name));
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
                            value    : activeFeatureRecord.ObjectID
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
                    //Update Grid
                    Ext.getCmp('rallygrid').bindStore(store);
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
    }
});