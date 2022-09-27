sap.ui.define(
    ["./BaseController", "sap/ui/model/json/JSONModel", "../model/formatter", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/MessageToast"]
    /**
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     * @param {typeof sap.m.MessageToast} MessageToast
     */,
    function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast) {
        "use strict";

        return BaseController.extend("com.yazaki.yazakisupload.controller.MainView", {
            formatter: formatter,
            onInit: function () {
                console.log("Init")
                let oViewModel;
                this._aTableSearchState = [];
                oViewModel = new JSONModel({
                    worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                    shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                    shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                    tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                });
                this.setModel(oViewModel, "worklistView");
                this.getRouter().getRoute("worklist").attachPatternMatched(this._onObjectMatched, this);
            },
            _onObjectMatched: function () {
                this._smartFilterBar = this.getView().byId("smartFilterBar");
                if (this._smartFilterBar.isInitialised()) {
                    this._smartFilterBar.search();
                }
                const that = this;
                this.getView()
                    .getModel()
                    .read("/xYZKNAxTM_V_STATLOOK_C", {
                        success: function (oData) {
                            if (oData.results) {
                                const oIconTabBar = that.getView().byId("idIconTabBar");
                                if (oIconTabBar.getItems().length < 3) {
                                    for (let index = 0; index < oData.results.length; index++) {
                                        const element = oData.results[index];
                                        const oItem = new sap.m.IconTabFilter({
                                            key: element.status_text,
                                            icon: element.status_icon,
                                            tooltip: element.status_text,
                                            text: element.status_text,
                                            iconColor: element.critical_code,
                                        });
                                        if (oData.results.length !== index && index > 0) {
                                            const oItemSep = new sap.m.IconTabSeparator({ icon: "sap-icon://process" });
                                            oIconTabBar.addItem(oItemSep);
                                        }
                                        oIconTabBar.addItem(oItem);
                                    }
                                }
                            }
                        },
                        error: function (oError) {},
                    });
            },
            onFilterSelect: function (oEvent) {
                this._smartFilterBar.search();
            },
            onSFBInitialized: function (oEvent) {
                this._smartFilterBar.search();
            },
            onDesSuggest: function (oEvent) {
                const sTerm = oEvent.getParameter("suggestValue");
                const aFilters = [];
                if (sTerm) {
                    aFilters.push(new Filter("loc_desc", FilterOperator.Contains, sTerm));
                }

                oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
            },
            onUpdateFinished: function (oEvent) {
                let sTitle,
                    oTable = oEvent.getSource(),
                    iTotalItems = oEvent.getParameter("total");
                if (iTotalItems && oTable.getBinding("items").isLengthFinal()) {
                    sTitle = this.getResourceBundle().getText("worklistTableTitleCount", [iTotalItems]);
                } else {
                    sTitle = this.getResourceBundle().getText("worklistTableTitle");
                }
                this.getModel("worklistView").setProperty("/worklistTableTitle", sTitle);
            },
            onPress: function (oEvent) {
                if (oEvent.getId() === "itemPress") {
                    this._showObject(oEvent.getParameter("listItem"));
                    return;
                }
                this._showObject(oEvent.getSource());
            },
            onNavBack: function () {
                history.go(-1);
            },
            onSearch: function (oEvent) {
                if (oEvent.getParameters().refreshButtonPressed) {
                    this.onRefresh();
                } else {
                    let aTableSearchState = [];
                    const sQuery = oEvent.getParameter("query");

                    if (sQuery && sQuery.length > 0) {
                        aTableSearchState = [new Filter("db_key", FilterOperator.Contains, sQuery)];
                    }
                    this._applySearch(aTableSearchState);
                }
            },
            onRefresh: function () {
                const oTable = this.byId("table");
                oTable.getBinding("items").refresh();
            },
            _showObject: function (oItem) {
                this.getRouter().navTo("object", {
                    objectId: oItem.getBindingContext().getPath().substring("/xYZKNAxTM_V_FWOHEAD_C".length),
                });
            },
            onAddWorklist: function () {
                this.getRouter().navTo("create", {});
            },
            onCopyWorklist: function (oEvent) {
                const oSelectedContext = this.getView().byId("idWorkListTable").getSelectedContexts();
                if (oSelectedContext && oSelectedContext.length > 0) {
                    const oObject = oSelectedContext[0].getObject();
                    this.getRouter().navTo("copy", {
                        objectId: oSelectedContext[0].getPath().substring("/xYZKNAxTM_V_FWOHEAD_C".length),
                    });
                } else {
                    MessageToast.show("Please select a worklist for Copy");
                }
            },
            onBeforeRebindingTable: function (oEvent) {
                const mBindingParams = oEvent.getParameter("bindingParams");
                const oForwordOrder = this.getView().byId("idForwardingOrder").getValue();
                const aFilters = [];
                if (oForwordOrder) {
                    aFilters.push(new Filter("trq_id", "EQ", oForwordOrder));
                }
                // var oCarrier = this.getView().byId("idFilterCarrier").getValue();
                // if(oCarrier) {
                //     aFilters.push(new Filter("carr_name", "Contains", oCarrier));
                // }
                const oPickUpFrom = this.getView().byId("DRS2").getFrom();
                if (oPickUpFrom) {
                    const oPickUpTo = this.getView().byId("DRS2").getTo();
                    aFilters.push(new Filter("pickup_dt", "BT", oPickUpFrom, oPickUpTo));
                }
                // var dateRangeFrom = this.getView().byId("DRS2").getFrom();
                // var dateRangeTo = this.getView().byId("DRS2").getTo();
                const oDestinationLoc = this.getView().byId("idFilterDestinationLocation").getValue();
                if (oDestinationLoc) {
                    aFilters.push(new Filter("des_loc_des", "Contains", oDestinationLoc));
                }
                const oStatus = this.getView().byId("idIconTabBar").getSelectedKey();
                if (oStatus && oStatus !== "All") {
                    aFilters.push(new Filter("fo_status", "EQ", oStatus));
                }
                const oFilter = new Filter({
                    filters: aFilters,
                    and: true,
                });
                mBindingParams.filters.push(oFilter);
                mBindingParams.sorter = [new sap.ui.model.Sorter("trq_id", true)];
            },
            _applySearch: function (aTableSearchState) {
                const oTable = this.byId("table"),
                    oViewModel = this.getModel("worklistView");
                oTable.getBinding("items").filter(aTableSearchState, "Application");
                if (aTableSearchState.length !== 0) {
                    oViewModel.setProperty("/tableNoDataText", this.getResourceBundle().getText("worklistNoDataWithSearchText"));
                }
            },
        });
    }
);
