'use strict';

const { Driver } = require('homey');
const https = require('https');


class MyDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Area Driver has been initialized');
  }

  testToken(clientId, clientSecret, callback) {
    var headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    var dataString = 'client_id=' + clientId + '&scope=ais&client_secret=' + clientSecret + '&grant_type=client_credentials';
    var options = {
      host: 'id.barentswatch.no',
      port: 443,
      path: '/connect/token',
      method: 'POST',
      headers: headers,
    };

    var req = https.request(options, function(res) {
      var chunks = [];
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        chunks.push(Buffer.from(chunk));
      });
      res.on('end', function () {
        if (res.statusCode == 200) {
          callback({ success: true });
        } else {
          callback({ success: false });
        }
      });
    });

    req.on('error', function(e) {
      callback({ success: false });
    });
    req.write(dataString);
    req.end();
  }

  async onPair(session) {
    this.log("onPair starting");
    this.log(session);

    this.store = { isAddable: this.getDevices().length < 3 };
    session.setHandler("getInfo", async (data) => {
      return this.store;
    });

    session.setHandler("updateArea", async (data) => {
      this.log('updateArea running');
      this.store.area = data;
      this.log(this.store);
    });

    session.setHandler("testLogin", async (data) => {
      this.log('testLogin running');

      this.store.name = data.name;
      if(this.store.clientId && this.store.clientSecret) {
        this.log("no login test needed");
        await session.showView("second");
        return;
      }
      this.testToken(data.clientId, data.clientSecret, async (result) => {
        if (result.success) {
          this.log("token success");
          this.store.clientId = data.clientId;
          this.store.clientSecret = data.clientSecret;
          await session.showView("second");
        } else {
          this.log("token failed");
          session.emit("loginFailed");
        }
      });
    });

    this.log("handlers registered");

    this.getDevices().forEach((dv, index) => {
      if (index == 0) {
        this.log("device store: " + JSON.stringify(dv.getStore()));
        var clientId = dv.getSetting("clientId");
        var clientSecret = dv.getSetting("clientSecret");
        if (clientId && clientSecret) {
          this.store.clientId = clientId;
          this.store.clientSecret = clientSecret;
          this.log("clientId and clientSecret found, adding to store");
        }
      }
    });

    await session.showView("first");
  }

}

module.exports = MyDriver;
