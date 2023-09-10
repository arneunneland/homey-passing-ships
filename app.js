'use strict';

const Homey = require('homey');

class MyApp extends Homey.App {

  logEntries = [];

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    process.env.TZ = 'Europe/Oslo';
    
    this.logger = async (data) => {
      this.homey.log(data);
      if (this.homey.app.logEntries.length > 30) {
        this.homey.app.logEntries.shift();
      }
      this.homey.app.logEntries.push(new Date().toISOString() + ": " + data);
    };


    this.log('Passing Ships has been initialized');
  }

  fetchLogs() {
    
    return this.logEntries.join('\n');
  }
}

module.exports = MyApp;


