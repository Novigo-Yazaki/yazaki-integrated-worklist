sap.ui.define([], function () {
  "use strict";

  return {

      /**
       * Rounds the number unit value to 2 digits
       * @public
       * @param {string} sValue the number string to be rounded
       * @returns {string} sValue with 2 digits rounded
       */
      numberUnit: function (sValue) {
          if (!sValue) {
              return "";
          }
          return parseFloat(sValue).toFixed(2);
      },
      formatIcon: function(oStatus){
          
          if (oStatus){
              if (oStatus==='Not Planned'){
                  return "sap-icon://present";
              } else if (oStatus==='Carrier Assigned'){
                  return "sap-icon://shipping-status";
              } else if (oStatus==='Sent'){
                  return "sap-icon://complete";
              } else if (oStatus==='Changed After Sending'){
                  return "sap-icon://edit-outside";
              } else if (oStatus==='In Tendering'){
                  return "sap-icon://status-critical";
              } else if (oStatus==='No Subcontracting Result'){
                  return "sap-icon://alert";
              }
              return "sap-icon://complete";
          }
          return 'sap-icon://complete';
      },
      formatDate: function(date,time,tzone){
        if(!date || !time || !tzone){
            return "";
        }
        let dateTimeString = new Date(Number(date.substr(4,4)),Number(date.substr(2,2))-1,Number(date.substr(0,2)),Number(time.substr(0,2)),Number(time.substr(2,2)),0).toLocaleString(undefined,{year: 'numeric',month: 'long',day:'numeric',hour:'numeric',minute:'numeric'});
        return `${dateTimeString} ${tzone}`;
      }

  };

});