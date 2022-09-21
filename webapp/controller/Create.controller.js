// @ts-nocheck
sap.ui.define(
    ["./BaseController", "sap/ui/model/json/JSONModel", "../model/formatter", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/MessageToast", "sap/m/MessageBox"]
    /**
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.model.Filter} Filter
     * @param {typeof sap.ui.model.FilterOperator} FilterOperator
     * @param {typeof sap.m.MessageToast} MessageToast
     * @param {typeof sap.m.MessageBox} MessageBox
     */,
    function (BaseController, JSONModel, formatter, Filter, FilterOperator, MessageToast, MessageBox) {
        "use strict";

        return BaseController.extend("com.yazaki.yazakisupload.controller.Create", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            /**
             * Called when the worklist controller is instantiated.
             * @public
             */
            onInit: function () {
                let oViewModel;

                // keeps the search state
                this._aTableSearchState = [];
                let imageEl = this.byId("idCompanyLogo");
                let imgSrc = sap.ui.require.toUrl("com/yazaki/yazakisupload/static/logo.png");
                imageEl.setSrc(imgSrc);
                // Model used to manipulate control states
                oViewModel = new JSONModel({
                    worklistTableTitle: this.getResourceBundle().getText("worklistTableTitle"),
                    shareSendEmailSubject: this.getResourceBundle().getText("shareSendEmailWorklistSubject"),
                    shareSendEmailMessage: this.getResourceBundle().getText("shareSendEmailWorklistMessage", [location.href]),
                    tableNoDataText: this.getResourceBundle().getText("tableNoDataText"),
                    isHeaderDataLoaded: false,
                    isItemDataLoaded: false,
                    isAttachmentDataLoaded: false,
                    quantityHelper: null,
                    weightHelper: null,
                    dimensionsHelper: null,
                    volumeHelper: null
                });
                this.setModel(oViewModel, "createItem");
                this.getRouter().getRoute("create").attachPatternMatched(this._onObjectMatched, this);
                this.getRouter().getRoute("copy").attachPatternMatched(this._onObjectMatchedCopy, this);
                this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatchedobject, this);
                this.getView().getModel("createItem").setProperty("/FWObject", false);
            },
            initializeUOMs: function () {
                
                const that = this;
                this.getView().getModel().read('/xYZKNAxTM_V_QUALOOK_C', {
                    success: function (oData) {
                        that.getView().getModel("createItem").setProperty("/quantityHelper", oData.results);
                    }
                });
                this.getView().getModel().read('/xYZKNAxTM_V_WEILOOK_C', {
                    success: function (oData) {
                        that.getView().getModel("createItem").setProperty("/weightHelper", oData.results);
                    }
                })
                this.getView().getModel().read('/xYZKNAxTM_V_MEASLOOK_C', {
                    success: function (oData) {
                        that.getView().getModel("createItem").setProperty("/dimensionsHelper", oData.results);
                    }
                })
                this.getView().getModel().read('/xYZKNAxTM_V_VOLLOOK_C', {
                    success: function (oData) {
                        that.getView().getModel("createItem").setProperty("/volumeHelper", oData.results);
                    }
                })
            },
            pickup_dtVlad: function () {
                const that = this;
                this.getView()
                    .getModel()
                    .read("/xYZKNAxTM_V_SRCLOC_C", {
                        success: function (oData) {
                            if (oData && oData.results.length > 0) {
                                let minDateString = oData.results[0].pickup_cutoff_date;
                                let minDateObj = new Date(Number(minDateString.substr(4, 4)), Number(minDateString.substr(2, 2)) - 1, Number(minDateString.substr(0, 2)), 0, 0, 0);
                                that.getView().getModel("createItem").setProperty("/xYZKNAxTM_V_SRCLOC_C", minDateObj);
                            }
                        },
                        error: function (oError) { },
                    });
            },
            _onObjectMatched: function () {
                this.pickup_dtVlad();
                this.initializeUOMs();
                this.getView().byId("page").setTitle("Create Load");
                this.getView().getModel("createItem").setProperty("/FWObject", false);
                const oDataHeader = {
                    SourceLocation: "",
                    PickupFromDatetime: null,
                    DestinationLocation: "",
                    SourceStreet: "",
                    SourceCity: "",
                    SourceRegion: "",
                    DestinationRegion: "",
                    DestinationCity: "",
                    DestinationStreet: "",
                };

                this.getView().getModel("createItem").setProperty("/FWOHeader", oDataHeader);
                this.getView().getModel("createItem").setProperty("/FWOItem", [this.getFWOItemData()]);
                this.getView().getModel("createItem").setProperty("/FwoHdrToAttachment", []);
                this.getSourceEditable();
                this.getView().getModel("createItem").setProperty("/isItemDataLoaded", true);
                this.getView().getModel("createItem").setProperty("/isAttachmentDataLoaded", true);
            },
            _onObjectMatchedCopy: function (oEvent) {
                this.getView().getModel("createItem").setProperty("/isAttachmentDataLoaded", true);
                this.pickup_dtVlad();
                this.initializeUOMs();
                this.getView().byId("page").setTitle("Copy Load");
                this.getView().getModel("createItem").setProperty("/FWObject", false);
                const sObjectId = oEvent.getParameter("arguments").objectId;
                // this._bindView("/xYZKNAxTM_V_FWOHEAD_C" + sObjectId);
                const that = this;

                this.getView()
                    .getModel()
                    .read(`/xYZKNAxTM_V_FWOHEAD_C${sObjectId}`, {
                        urlParameters: {
                            $expand: "to_item",
                        },
                        success: function (oData) {
                            if (oData) {
                                const oDataHeader = {
                                    SourceLocation: oData.src_loc_des,
                                    PickupFromDatetime: oData.pickup_dt,
                                    DestinationLocation: oData.des_loc_des,
                                    DestinationCountry: oData.des_country,
                                    DestinationRegion: oData.des_region,
                                    DestinationCity: oData.des_city,
                                    DestinationPostalcode: oData.des_postal_code,
                                    DestinationStreet: oData.des_street,
                                    DestinationHouseNum: oData.des_house_num,
                                };
                                const FWOItem = [];
                                that.getView().getModel("createItem").setProperty("/FWOHeader", oDataHeader);
                                if (oData.to_item && oData.to_item.results) {
                                    for (let index = 0; index < oData.to_item.results.length; index++) {
                                        const element = oData.to_item.results[index];
                                        const oItem = that.getFWOItemData();
                                        oItem.ItemDescr=element.item_descr;
                                        oItem.Quantity = element.qua_pcs_val;
                                        oItem.QuantityUom = element.qua_pcs_uni;
                                        oItem.Weight = element.gro_wei_val;
                                        oItem.WeightUom = element.gro_wei_uni;
                                        oItem.Length = element.length;
                                        oItem.Width = element.width;
                                        oItem.Height = element.height;
                                        oItem.DimUom = element.measuom;
                                        oItem.Volume = element.gro_vol_val;
                                        oItem.VolumeUom = element.gro_vol_uni;
                                        FWOItem.push(oItem);
                                    }
                                    that.getView().getModel("createItem").setProperty("/FWOItem", FWOItem);
                                    that.getSourceEditable();
                                    that.getView().getModel("createItem").setProperty("/FwoHdrToAttachment", []);
                                    // that.getView().byId("idDestinationLocation").fireSelectionChange();
                                }
                            }
                            that.getView().getModel("createItem").setProperty("/isItemDataLoaded", true);
                        },
                        error: function (oError) { },
                    });
            },
            addedAtt: [],
            deletedAtt: [],
            _onObjectMatchedobject: function (oEvent) {
                this.pickup_dtVlad();
                this.addedAtt = [];
                this.deletedAtt = [];
                this.getView().byId("page").setTitle("Load");
                this.getView().getModel("createItem").setProperty("/FWObject", true);
                if (oEvent) {
                    var sObjectId = oEvent.getParameter("arguments").objectId;
                    this.sObjectId = oEvent.getParameter("arguments").objectId;
                } else {
                    var sObjectId = this.sObjectId;
                }
                // this._bindView("/xYZKNAxTM_V_FWOHEAD_C" + sObjectId);
                const that = this;
                this.getStatusLookUp();
                this.getView()
                    .getModel()
                    .read(`/xYZKNAxTM_V_FWOHEAD_C${sObjectId}`, {
                        urlParameters: {
                            $expand: "to_item,to_atta",
                        },
                        success: function (oData) {
                            if (oData) {
                                const oDataHeader = {
                                    SourceLocation: oData.src_loc_des,
                                    SourceHouseNum: oData.src_house_num,
                                    SourceStreet: oData.src_street,
                                    SourceCity: oData.src_city,
                                    SourcePostalcode: oData.src_postal_code,
                                    SourceRegion: oData.src_region,
                                    SourceCountry: oData.src_country,
                                    PickupFromDatetime: oData.pickup_dt,
                                    DestinationLocation: oData.des_loc_des,
                                    DestinationCountry: oData.des_country,
                                    DestinationRegion: oData.des_region,
                                    DestinationCity: oData.des_city,
                                    DestinationPostalcode: oData.des_postal_code,
                                    DestinationStreet: oData.des_street,
                                    DestinationHouseNum: oData.des_house_num,
                                    planner_email: oData.planner_email,
                                    truck_number: oData.truck_number,
                                    fo_id: oData.fo_id,
                                    gro_wei_uni: oData.gro_wei_uni,
                                    gro_wei_val: oData.gro_wei_val,
                                    gro_vol_uni: oData.gro_vol_uni,
                                    gro_vol_val: oData.gro_vol_val,
                                    tsp_id: oData.tsp_id,
                                    fo_status: oData.fo_status,
                                    trq_id: oData.trq_id,
                                };
                                const FWOItem = [];
                                const FWOAttachmentSet = [];
                                that.getView().getModel("createItem").setProperty("/FWOHeader", oDataHeader);
                                if (oData.to_item && oData.to_item.results) {
                                    for (let index = 0; index < oData.to_item.results.length; index++) {
                                        const element = oData.to_item.results[index];
                                        const oItem = that.getFWOItemData();
                                        oItem.ItemDescr = element.item_descr;
                                        oItem.Quantity = element.qua_pcs_val;
                                        oItem.QuantityUom = element.qua_pcs_uni;
                                        oItem.Weight = element.gro_wei_val;
                                        oItem.WeightUom = element.gro_wei_uni;
                                        oItem.Length = element.length;
                                        oItem.Width = element.width;
                                        oItem.Height = element.height;
                                        oItem.DimUom = element.measuom;
                                        oItem.Volume = element.gro_vol_val;
                                        oItem.VolumeUom = element.gro_vol_uni;
                                        FWOItem.push(oItem);
                                    }
                                    that.getView().getModel("createItem").setProperty("/FWOItem", FWOItem);
                                    // that.getSourceEditable();
                                    for (let index = 0; index < oData.to_atta.results.length; index++) {
                                        const element = oData.to_atta.results[index];
                                        const oAttItem = that.getFwoHdrToAttachment();
                                        oAttItem.FwoNum = element.trq_id;
                                        oAttItem.Name = element.name;
                                        oAttItem.AlternativeName = element.alternative_name;
                                        oAttItem.Description = element.description;
                                        oAttItem.FilesizeContent = element.filesize_content;
                                        oAttItem.Folder = element.folder;
                                        oAttItem.AttachmentType = element.attachment_type;
                                        oAttItem.MimeCode = element.MimeCode;
                                        oAttItem.doc_key = element.doc_key;
                                        oAttItem.created_by = element.created_by;
                                        oAttItem.created_on_dt = element.created_on_dt;
                                        oAttItem.created_on_tm = element.created_on_tm;
                                        oAttItem.AttachmentData = "";
                                        FWOAttachmentSet.push(oAttItem);
                                    }
                                    that.getView().getModel("createItem").setProperty("/FwoHdrToAttachment", FWOAttachmentSet);
                                    that.getView().getModel("createItem").setProperty("/isHeaderDataLoaded", true);
                                    that.getView().getModel("createItem").setProperty("/isItemDataLoaded", true);
                                    that.getView().getModel("createItem").setProperty("/isAttachmentDataLoaded", true);
                                    // that.getView().byId("idDestinationLocation").fireSelectionChange();
                                }
                            }
                        },
                        error: function (oError) { },
                    });
            },
            getSourceEditable: function () {
                
                const that = this;
                that.getView().getModel("createItem").setProperty("/SourceEditable", true);
                this.getView()
                    .getModel()
                    .read("/xYZKNAxTM_V_SRCLOC_C", {
                        success: function (oData) {
                            if (oData && oData.results) {
                                that.getView().getModel("createItem").setProperty("/isHeaderDataLoaded", true);
                                if (oData.results.length === 1) {

                                    that.getView().getModel("createItem").setProperty("/SourceEditable", false);
                                    const oSelectedObject = oData.results[0];
                                    that.getView().getModel("createItem").setProperty("/FWOHeader/SourceLocation", oData.results[0].descr40);
                                    that.getView()
                                        .getModel("createItem")
                                        .setProperty("/FWOHeader/SourceHouseNum", oSelectedObject.house_num_street ? oSelectedObject.house_num_street.split(",")[0] : "");
                                    that.getView()
                                        .getModel("createItem")
                                        .setProperty("/FWOHeader/SourceStreet", oSelectedObject.house_num_street ? oSelectedObject.house_num_street.split(",")[1] : "");
                                    that.getView()
                                        .getModel("createItem")
                                        .setProperty("/FWOHeader/SourceCity", oSelectedObject.city_zip ? oSelectedObject.city_zip.split("-")[1] : "");
                                    that.getView()
                                        .getModel("createItem")
                                        .setProperty("/FWOHeader/SourcePostalcode", oSelectedObject.city_zip ? oSelectedObject.city_zip.split("-")[1] : "");
                                    that.getView()
                                        .getModel("createItem")
                                        .setProperty("/FWOHeader/SourceCountry", oSelectedObject.region_country ? oSelectedObject.region_country.split(",")[1] : "");
                                    that.getView()
                                        .getModel("createItem")
                                        .setProperty("/FWOHeader/SourceRegion", oSelectedObject.region_country ? oSelectedObject.region_country.split(",")[0] : "");
                                    // that.getView().getModel("createItem").setProperty("/FWOHeader/SourceLocation",oData.results[0].descr40);
                                    // that.getView().byId("idSourceLocation").fireSelectionChange();
                                }
                            }
                        },
                        error: function (oError) { },
                    });
            },
            onSourceChange: function (oEvent) {
                this._valueStateReset(oEvent);
                const oSelectedObject = oEvent.getParameters().selectedItem.getBindingContext().getObject();
                const oData = this.getView().getModel("createItem").getProperty("/FWOHeader");
                oData.SourceLocation = oSelectedObject.descr40;
                oData.SourceHouseNum = oSelectedObject.house_num_street ? oSelectedObject.house_num_street.split(",")[0] : "";
                oData.SourceStreet = oSelectedObject.house_num_street ? oSelectedObject.house_num_street.split(",")[1] : "";
                oData.SourceCity = oSelectedObject.city_zip ? oSelectedObject.city_zip.split("-")[0] : "";
                oData.SourcePostalcode = oSelectedObject.city_zip ? oSelectedObject.city_zip.split("-")[1] : "";
                oData.SourceRegion = oSelectedObject.region_country ? oSelectedObject.region_country.split(",")[0] : "";
                oData.SourceCountry = oSelectedObject.region_country ? oSelectedObject.region_country.split(",")[1] : "";
                this.getView().getModel("createItem").setProperty("/FWOHeader", oData);
                this.getView().getModel("createItem").updateBindings();
            },
            onDestinationChange: function (oEvent) {
                this._valueStateReset(oEvent);
                const oSelectedObject = oEvent.getParameters().selectedItem.getBindingContext().getObject();
                const oData = this.getView().getModel("createItem").getProperty("/FWOHeader");
                oData.DestinationLocation = oSelectedObject.loc_desc;
                oData.DestinationHouseNum = oSelectedObject.house_num_street ? oSelectedObject.house_num_street.split(",")[0] : "";
                oData.DestinationStreet = oSelectedObject.house_num_street ? oSelectedObject.house_num_street.split(",")[1] : "";
                oData.DestinationCity = oSelectedObject.city_zip ? oSelectedObject.city_zip.split("-")[0] : "";
                oData.DestinationPostalcode = oSelectedObject.city_zip ? oSelectedObject.city_zip.split("-")[1] : "";
                oData.DestinationRegion = oSelectedObject.region_country ? oSelectedObject.region_country.split(",")[0] : "";
                oData.DestinationCountry = oSelectedObject.region_country ? oSelectedObject.region_country.split(",")[1] : "";
                this.getView().getModel("createItem").setProperty("/FWOHeader", oData);
                this.getView().getModel("createItem").updateBindings();
            },

            getFWOItemData: function () {
                const oDataItem = {
                    ItemDescr: "",
                    Quantity: "",
                    QuantityUom: "",
                    Weight: "",
                    WeightUom: "",
                    Length: "",
                    Width: "",
                    Height: "",
                    DimUom: "",
                    Volume: "",
                    VolumeUom: "",
                };
                return oDataItem;
            },

            onAddItem: function () {
                const oItems = this.getView().getModel("createItem").getProperty("/FWOItem");
                oItems.push(this.getFWOItemData());
                this.getView().getModel("createItem").setProperty("/FWOItem", oItems);
                this.getView().getModel("createItem").updateBindings();
            },
            onDeleteRow: function (oEvent) {
                const sItem = oEvent.getParameter("listItem").getBindingContextPath();
                const sIndex = parseInt(sItem.split("/")[sItem.split("/").length - 1]);
                const oItems = this.getView().getModel("createItem").getProperty("/FWOItem");
                oItems.splice(sIndex, 1);
                this.getView().getModel("createItem").setProperty("/FWOItem", oItems);
                this.getView().getModel("createItem").updateBindings();
            },
            onNavBack: function () {
                // var sPreviousHash = History.getInstance().getPreviousHash();
                // if (sPreviousHash !== undefined) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
                // } else {
                //     this.getRouter().navTo("worklist", {}, true);
                // }
            },
            onSavePress: function () {
                const oItem = this.getView().getModel("createItem").getProperty("/FWOItem");
                let itemFields= this.getView().getControlsByFieldGroupId("ItemFields").filter(c => c.isA("sap.m.Input")|| c.isA("sap.m.ComboBox"));
                if (this._validateInputs(itemFields)) {
                    MessageToast.show("Please fill mandatory fields !");
                }
                else{
                    this.CreateHeader();
                }
            },
            CreateHeader: function () {
                const oHeader = this.getView().getModel("createItem").getProperty("/FWOHeader");
                // oHeader.PickupFromDatetime=new Date(oHeader.PickupFromDatetime);
                const that = this;
                // oHeader.PickupFromDatetime=oHeader.PickupFromDatetime.toISOString();

                oHeader.FwoHdrToItem = this.getView().getModel("createItem").getProperty("/FWOItem");
                const attData = that.getView().getModel("createItem").getProperty("/FwoHdrToAttachment");
                const base64ToHex = function (str) {
                    const raw = atob(str);
                    let result = "";
                    for (let i = 0; i < raw.length; i++) {
                        const hex = raw.charCodeAt(i).toString(16);
                        result += hex.length === 2 ? hex : `0${hex}`;
                    }
                    return result.toUpperCase();
                };
                for (let index = 0; index < attData.length; index++) {
                    const element = attData[index];
                    // const buffer = Buffer.from(element.AttachmentData, 'base64');
                    // const bufString = buffer.toString('hex');
                    const regex = /data:(\w.*);base64,/gm;
                    const m = regex.exec(element.AttachmentData),
                        decodedPdfContent = element.AttachmentData.replace(regex, "");
                    element.AttachmentData = base64ToHex(decodedPdfContent);
                    element.FilesizeContent = element.FilesizeContent.toString();
                    delete element.Stream;
                }
                oHeader.FwoHdrToAttachment = attData;

                this.getView()
                    .getModel()
                    .create("/FWOHeaderSet", oHeader, {
                        success: function (oData) {
                            MessageBox.success(`Worklist Created with Forwarding order :${oData.FwoNum}`, {
                                actions: [MessageBox.Action.OK],
                                emphasizedAction: MessageBox.Action.OK,
                                onClose: function (sAction) {
                                    that.onNavBack();
                                    // MessageToast.show("Action selected: " + sAction);
                                },
                            });
                            // MessageToast.show("Worklist Created with Forwarding order :"+oData.FwoNum);
                            // that.saveAttachment(oData.FwoNum);
                            // that.onNavBack();
                        },
                        error: function (oError) {
                            that.saveAttachment();
                        },
                    });
            },
            saveAttachment: function (fwdNo) {
                const that = this;
                const attData = that.getView().getModel("createItem").getProperty("/FwoHdrToAttachment");
                for (let index = 0; index < attData.length; index++) {
                    const element = attData[index];
                    delete element.Stream;
                    element.FwoNum = fwdNo;

                    // var payload={
                    //     "FWO_NUM":element.FwoNum,
                    //     "DOC_KEY":"",
                    //     "NAME":element.Name,
                    //     "ALTERNATIVE_NAME":element.AlternativeName,
                    //     "FILESIZE_CONTENT":element.FilesizeContent,
                    //     "DESCRIPTION":element.Description,
                    //     "FOLDER":element.Folder,
                    //     "MIME_CODE":element.MimeCode,
                    //     "ATTACHMENT_TYPE":element.AttachmentType,
                    //     "ATTACHMENT_DATA":element.AttachmentData
                    // }
                    this.getView()
                        .getModel()
                        .create("/FWOAttachmentSet", element, {
                            success: function (oData) {
                                MessageToast.show("Attachment Saved Successfully.");
                                that.onNavBack();
                            },
                            error: function (oError) { },
                        });
                }
            },
            getFwoHdrToAttachment: function () {
                const oItem = {
                    FwoNum: "",
                    Name: "",
                    AlternativeName: "",
                    Description: "",
                    FilesizeContent: "",
                    Folder: "",
                    AttachmentType: "ATCMT",
                    MimeCode: "",
                    AttachmentData: "",
                };
                return oItem;
            },
            onUploadChange: function (oEvent) {
                try {
                    const files = oEvent.getParameter("files");
                    const fileData = this.getFwoHdrToAttachment();
                    fileData.Name = files[0].name;
                    fileData.AlternativeName = files[0].name;
                    // fileData.AttachmentType=files[0].type;
                    fileData.MimeCode = files[0].type;
                    fileData.FilesizeContent = files[0].size;
                    this.files = files;
                    const that = this;
                    //
                    if (!files.length) {
                        // Blank
                    } else {
                        const reader = new FileReader();
                        reader.onload = async function (e) {
                            try {
                                //
                                const vContent = e.currentTarget.result; // .replace("data:application/pdf;base64,", ""); //.result.replace("data:image/jpeg;base64,", "");
                                fileData.AttachmentData = vContent;
                                // that.onExport();
                                fileData.Stream = that.convertFileToUrl(vContent);
                                const attData = that.getView().getModel("createItem").getProperty("/FwoHdrToAttachment");
                                attData.push(fileData);
                                that.addedAtt.push(fileData);
                                that.getView().getModel("createItem").setProperty("/FwoHdrToAttachment", attData);
                                // let oAttDta={
                                // 	"U_NEO_JBS_PATH":fileData.Name,
                                // 	"U_NEO_JBS_MIMETYPE":fileData.Type,
                                // 	"U_NEO_JBS_EXPENSEID":oAttachData.U_NEO_JBS_TSHEETID,
                                // 	"U_NEO_JBS_TSHEETID":oAttachData.DocEntry?oAttachData.DocEntry:null,
                                // 	"FileContent":that.attachextraContentRemove(fileData.Content),
                                // 	"FileStream": fileData.Stream,
                                // 	"FileStatus":"N",
                                // 	"Type": await that.formatExpType(oAttachData.U_NEO_JBS_TYPE,oAttachData.U_NEO_JBS_TYPEID)
                                // };
                                // oAttachData.attachment.push(oAttDta);
                                // oAttachData.localStatus=oAttachData.localStatus==="N"?oAttachData.localStatus:"U";
                                // that.getView().getModel("timesheetData").setProperty(that.oAttachmentSelectedPath,oAttachData);
                                that.getView().getModel("createItem").updateBindings();
                            } catch (err) {
                                console.log(err);
                            }
                        };
                        reader.readAsDataURL(files[0]);
                    }
                } catch (error) { }
            },
            // onAttachmentFragPress:function(oEvent){},
            convertFileToUrl: function (vContent) {
                const regex = /data:(\w.*);base64,/gm;
                const m = regex.exec(vContent),
                    decodedPdfContent = atob(vContent.replace(regex, ""));
                const byteArray = new Uint8Array(decodedPdfContent.length);
                for (let i = 0; i < decodedPdfContent.length; i++) {
                    byteArray[i] = decodedPdfContent.charCodeAt(i);
                }
                const blob = new Blob([byteArray.buffer], {
                    type: m ? m[1] : "application/pdf",
                });
                jQuery.sap.addUrlWhitelist("blob");
                return URL.createObjectURL(blob);
            },
            attachextraContentRemove: function (vContent) {
                const regex = /data:(\w.*);base64,/gm;
                const data = vContent.replace(regex, "");
                return data;
            },
            onLinkPress: function (oEvent) {
                const oObject = oEvent.getSource().getBindingContext("createItem").getObject();
                var oUrl = oObject.Stream;
                if (!oUrl) {
                    var oUrl = "/58c73230-5fdc-4195-869b-99e3afaced98.com-yazaki-yazakisupload.comyazakiyazakisupload/sap/opu/odata/YZKNA/TM_FWO_SRV/FWOAttachmentSet(FwoNum='" + oObject.FwoNum + "',DocKey='" + oObject.doc_key + "',Name='" + oObject.Name + "',AlternativeName='" + oObject.AlternativeName + "',Description='" + oObject.Description + "',Folder='" + oObject.Folder + "',AttachmentType='" + oObject.AttachmentType + "')/$value";
                }
                window.open(oUrl);
            },
            formatFoStatus: function (oData) {
                if (oData) {
                    const oStatusSet = this.getView().getModel("createItem").getProperty("/xYZKNAxTM_V_STATLOOK_C");
                    for (let index = 0; index < oStatusSet.length; index++) {
                        const element = oStatusSet[index];
                        if (oData === element.status_text) {
                            return element.status_icon;
                        }
                    }
                }
                return "";
            },
            onDeleteAtt: function (oEvent) {
                const oItem = oEvent.getParameter("listItem").getBindingContext("createItem").getObject();
                // this.addedAtt=[];
                this.deletedAtt.push(oItem);
                const sItem = oEvent.getParameter("listItem").getBindingContextPath();
                const sIndex = parseInt(sItem.split("/")[sItem.split("/").length - 1]);
                const oItems = this.getView().getModel("createItem").getProperty("/FwoHdrToAttachment");
                oItems.splice(sIndex, 1);
                this.getView().getModel("createItem").setProperty("/FwoHdrToAttachment", oItems);
                this.getView().getModel("createItem").updateBindings();
            },
            onUpdatePress: function (oEvent) {
                const base64ToHex = function (str) {
                    const raw = atob(str);
                    let result = "";
                    for (let i = 0; i < raw.length; i++) {
                        const hex = raw.charCodeAt(i).toString(16);
                        result += hex.length === 2 ? hex : `0${hex}`;
                    }
                    return result.toUpperCase();
                };
                const addedAtt = this.addedAtt;
                const deletedAtt = this.deletedAtt;
                var that = this;
                for (let index = 0; index < addedAtt.length; index++) {
                    const element = addedAtt[index];
                    delete element.Stream;
                    element.AttachmentType = "ATCMT";
                    element.FilesizeContent = element.FilesizeContent ? element.FilesizeContent.toString() : "";
                    element.FwoNum = this.getView().getModel("createItem").getProperty("/FWOHeader/trq_id");
                    const regex = /data:(\w.*);base64,/gm;
                    const m = regex.exec(element.AttachmentData),
                        decodedPdfContent = element.AttachmentData.replace(regex, "");
                    element.AttachmentData = base64ToHex(decodedPdfContent);

                    // var payload={
                    //     "FWO_NUM":element.FwoNum,
                    //     "DOC_KEY":"",
                    //     "NAME":element.Name,
                    //     "ALTERNATIVE_NAME":element.AlternativeName,
                    //     "FILESIZE_CONTENT":element.FilesizeContent,
                    //     "DESCRIPTION":element.Description,
                    //     "FOLDER":element.Folder,
                    //     "MIME_CODE":element.MimeCode,
                    //     "ATTACHMENT_TYPE":element.AttachmentType,
                    //     "ATTACHMENT_DATA":element.AttachmentData
                    // }
                    // this.getView().getModel().setHeaders({"SLUG":JSON.stringify(element)})
                    this.getView()
                        .getModel()
                        .create("/FWOCreateAttachmentSet", element, {
                            success: function (oData) {
                                MessageToast.show("Attachment Saved Successfully.");
                                // that.onNavBack();
                                that._onObjectMatchedobject();
                            },
                            error: function (oError) { },
                        });
                }
                for (let index = 0; index < deletedAtt.length; index++) {
                    const element = deletedAtt[index];
                    const oUrl = `/FWOAttachmentSet(FwoNum='${element.FwoNum}',DocKey='${element.doc_key}',Name='${element.Name}',AlternativeName='${element.AlternativeName}',Description='${element.Description}',Folder='${element.Folder}',AttachmentType='${element.AttachmentType}')/$value`;
                    this.getView()
                        .getModel()
                        .remove(oUrl, {
                            success: function (oData) {
                                MessageToast.show("Attachment Deleted Successfully.");
                                // that.onNavBack();
                                that._onObjectMatchedobject();
                            },
                            error: function (oError) { },
                        });
                }
            },
            _validateInputs: function (fwoItems) {
                let oView = this.getView();
                let _validationError = false;

                fwoItems.forEach(function(itemInput) {
                    _validationError = this._validateItemInput(itemInput) || _validationError
                },this)
                
                return _validationError;
                
            },
            _validateInput: function (oInput) {
                var sValueState = "None";
                var bValidationError = false;
                var oBinding = oInput.getBinding("value");

                if(!oBinding){
                    sValueState = "Error";
                    bValidationError = true;
                }
                oInput.setValueState(sValueState);
                return bValidationError;
            },
            _validateItemInput: function (oInput) {
                if(!oInput.getValue()) {
                    oInput.setValueState("Error")
                    return true;
                }
            },
            _valueStateReset: function(oInput) {
                if(oInput.getValueState() === "Error"){
                    oInput.setValueState("Success");
                }
            },
            onPickupDateChange(oInput) {
                this._valueStateReset(oInput);
            },
        });
    }
);
