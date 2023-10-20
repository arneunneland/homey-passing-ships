'use strict';

const { Driver } = require('homey');
class MyDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Area Driver has been initialized');
  }

  async onPair(session) {
    this.log("onPair starting");
    this.log(session);

    var store = {};
    session.setHandler("getArea", async (data) => {
      this.log("getArea running.. " + data);
      return {};
    });

    session.setHandler("updateArea", async (data) => {
      this.log('updateArea running');
      store.area = data;
      this.log(data);
    });
    this.log("handlers registered");

    await session.showView("first");
  }

}

module.exports = MyDriver;
