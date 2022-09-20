sap.ui.define(
    ["sap/ui/core/mvc/Controller", "sap/ui/core/UIComponent", "sap/m/library"]
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     * @param {typeof sap.ui.core.UIComponent} UIComponent
     * @param {typeof sap.m.library} mobileLibrary
     */,
    function (Controller, UIComponent, mobileLibrary) {
        "use strict";

        // shortcut for sap.m.URLHelper
        const URLHelper = mobileLibrary.URLHelper;

        return Controller.extend("com.yazaki.yazakisupload.controller.BaseController", {
            /**
             * Convenience method for accessing the router.
             * @public
             * @returns {sap.ui.core.routing.Router} the router for this component
             */
            getRouter: function () {
                return UIComponent.getRouterFor(this);
            },

            /**
             * Convenience method for getting the view model by name.
             * @public
             * @param {string} [sName] the model name
             * @returns {sap.ui.model.Model} the model instance
             */
            getModel: function (sName) {
                return this.getView().getModel(sName);
            },

            /**
             * Convenience method for setting the view model.
             * @public
             * @param {sap.ui.model.Model} oModel the model instance
             * @param {string} sName the model name
             * @returns {sap.ui.mvc.View} the view instance
             */
            setModel: function (oModel, sName) {
                return this.getView().setModel(oModel, sName);
            },

            /**
             * Getter for the resource bundle.
             * @public
             * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
             */
            getResourceBundle: function () {
                return this.getOwnerComponent().getModel("i18n").getResourceBundle();
            },

            /**
             * Event handler when the share by E-Mail button has been clicked
             * @public
             */
            onShareEmailPress: function () {
                const oViewModel = this.getModel("objectView") || this.getModel("worklistView");
                URLHelper.triggerEmail(null, oViewModel.getProperty("/shareSendEmailSubject"), oViewModel.getProperty("/shareSendEmailMessage"));
            },
            getStatusLookUp: function () {
                const that = this;
                this.getView()
                    .getModel()
                    .read("/xYZKNAxTM_V_STATLOOK_C", {
                        success: function (oData) {
                            
                            if (oData.results) {
                                that.getView().getModel("createItem").setProperty("/xYZKNAxTM_V_STATLOOK_C", oData.results);
                            }
                        },
                        error: function (oError) {
                            
                        },
                    });
            },
        });
    }
);
