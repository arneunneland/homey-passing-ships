'use strict';

const { Device } = require('homey');
const AisWatcher = require('./../../source/aisWatcher.js');

class MyDevice extends Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    const settings = this.getSettings();
    if (settings.latitude) {
      this.latitude = parseFloat(settings.latitude);
    } else {
      this.latitude = this.homey.geolocation.getLatitude()
    }
    if (settings.longitude) {
      this.longitude = parseFloat(settings.longitude);
    } else {
      this.longitude = this.homey.geolocation.getLongitude();
    }
    this.clientId = settings.clientId;
    this.clientSecret = settings.clientSecret;
    this.area = settings.area;

    this.logger = this.homey.app.logger;
    this.aisWatcher = new AisWatcher(this.homey, this.logger, this.latitude, this.longitude, this.clientId, this.clientSecret, this.area); 

    this.aisWatcher.eventEmitter.on('update', async (data) => {
      this.setCapabilityValue('closestShip', data.closestShip).catch(this.error);
      this.setCapabilityValue('closestShipCourse', data.closestShipCourse).catch(this.error);
      this.setCapabilityValue('closestShipBearing', data.closestShipBearing).catch(this.error);
      this.setCapabilityValue('currentMovingShips', data.currentMovingShips).catch(this.error);
      this.setCapabilityValue('lastStatus', data.lastStatus).catch(this.error);
      this.setCapabilityValue('numberOfShips', data.numberOfShips).catch(this.error);
      this.setCapabilityValue('shipLength', data.length).catch(this.error);
      this.setCapabilityValue('shipWidth', data.width).catch(this.error);
      this.setCapabilityValue('aisDestination', data.destination).catch(this.error);
      this.setCapabilityValue('shipType', data.shipTypeAsText).catch(this.error);
    });

    this.aisWatcher.eventEmitter.on('config', async (data) => {
      this.logger("Config error: " + data.text);
      this.setCapabilityValue('lastStatus', data.text).catch(this.error);
    });

    const shipPassingTrigger = this.homey.flow.getDeviceTriggerCard('passingShip');
    shipPassingTrigger.registerRunListener(async (args, state) => {
      return true;
    });

    const shipPassingNameTrigger = this.homey.flow.getDeviceTriggerCard('passingShipName');
    shipPassingNameTrigger.registerRunListener(async (args, state) => {
      return args.name.toUpperCase() === state.name.toUpperCase();
    });

    const shipPassingComingFromTrigger = this.homey.flow.getDeviceTriggerCard('passingShipComingFrom');
    shipPassingComingFromTrigger.registerRunListener(async (args, state) => {
      return args.comingFrom.toUpperCase() === state.comingFrom.toUpperCase();
    });

    const shipPassingSpeedTrigger = this.homey.flow.getDeviceTriggerCard('passingShipSpeed');
    shipPassingSpeedTrigger.registerRunListener(async (args, state) => {
      return +args.speed <= state.speed;
    });

    const shipPassingLengthTrigger = this.homey.flow.getDeviceTriggerCard('passingShipLength');
    shipPassingLengthTrigger.registerRunListener(async (args, state) => {
      return +args.length <= +state.length;
    });

    this.aisWatcher.eventEmitter.on('passingship', async (data) => {
      await shipPassingTrigger.trigger(this, data, data);
      await shipPassingNameTrigger.trigger(this, data, data);
      await shipPassingComingFromTrigger.trigger(this, data, data);
      await shipPassingSpeedTrigger.trigger(this, data, data);
      await shipPassingLengthTrigger.trigger(this, data, data);
    });

    this.logger('Area has been initialized');
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.logger('Area has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    if (newSettings.latitude) {
      this.latitude = parseFloat(newSettings.latitude);
    } else {
      this.latitude = this.homey.geolocation.getLatitude()
    }
    if (newSettings.longitude) {
      this.longitude = parseFloat(newSettings.longitude);
    } else {
      this.longitude = this.homey.geolocation.getLongitude()
    }
    this.clientId = newSettings.clientId;
    this.clientSecret = newSettings.clientSecret;
    this.area = newSettings.area;

    this.aisWatcher.updateSettings(this.latitude, this.longitude, this.clientId, this.clientSecret, this.area);
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.logger('Area was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    this.aisWatcher.destroy();
    this.logger('Area has been deleted');
  }

}

module.exports = MyDevice;
