'use strict';

const { randomUUID } = require('crypto');
const { Driver } = require('homey');

class MyDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Area Driver has been initialized');
  }

  async onPair(session) {
    console.log("onPair starting");
    this.log("onPair starting");

    // Received when a view has changed
    session.setHandler("showView", async function (viewId) {
      this.log("View: " + viewId);
    });

    session.setHandler("my_event", async function (data) {
      // data is { 'foo': 'bar' }
      return "Hello!";
    });

    session.setHandler("showView", async (viewId) => {
      if (viewId === "area_view") {
        const data = await session.emit("hello", "Hello to you!");
        this.log(data); // Hi!
      }
    });
    this.log("handlers registered");

    await session.showView("areaview");
    await session.done();
  }

 
  /**
   * onPairListDevices is called when a user is adding a device
   * and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices() {
    if (this.getDevices().length > 0) {
      return [];
    }
    return [{
      name: "Passing ships",
    
      data: {
        id: randomUUID()
      }
    }];
  }

}

module.exports = MyDriver;
