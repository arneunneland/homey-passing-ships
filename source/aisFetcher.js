'use strict';

const EventEmitter = require('events');
var https = require('https');

class AisFetcher {
  constructor(homey, logger, clientId, clientSecret, area) {
    this.eventEmitter = new EventEmitter()
    this.homey = homey;
    this.logger = logger;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.area = area;
    this.waitingForAis = false;
    this.fetchNewBearerToken = true;
    this.lastAisData = 0;
    this.ships = new Map();

    this.updateData();
    this.updateInterval = this.homey.setInterval(async () => {
      this.updateData();
    }, 30000);
  }

  destroy() {
    this.homey.clearInterval(this.updateInterval);
  }

  updateSettings(clientId, clientSecret, area) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.area = area;
    this.updateData();
  }

  async updateData() {
    if (!this.waitingForAis || (Date.now() - this.lastAisData > 320000)) {
      if (this.fetchNewBearerToken || (Date.now() - this.lastAisData > 320000)) {
        this.fetchNewBearerTokenAndFetchAisData(this.clientId, this.clientSecret);
      } else {
        this.fetchAisData(this.bearerToken);
      }
    }
  }

  async fetchNewBearerTokenAndFetchAisData(clientId, clientSecret) {  
    if (!clientId) {
      this.eventEmitter.emit('config', { text: 'Config: Missing clientId' });      
      return;
    }
    if (!clientSecret) {
      this.eventEmitter.emit('config', { text: 'Config: Missing clientSecret' });      
      return;
    }
    var aisObj = this;
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
          var body = Buffer.concat(chunks).toString('utf8');
          var token = JSON.parse(body);
          aisObj.bearerToken = token.access_token;
          aisObj.fetchNewBearerToken = false;
          aisObj.logger("New bearer token");
          aisObj.fetchAisData(token.access_token);
        } else {
          aisObj.eventEmitter.emit('config', { text: 'Config: Wrong id and/or secret' });
        }
      });
    });

    req.on('error', function(e) {
      console.log('problem with request: ' + e.message);
    });
    req.write(dataString);
    req.end();
  }

  async fetchAisData(token) {
    var aisObj = this;

    if (!this.area) {
      this.eventEmitter.emit('config', { text: 'Config: Missing area' });      
      return;
    }

    aisObj.waitingForAis = true;
    var geometry = {};
    try {
      geometry = JSON.parse(this.area);
    } catch (error) {
      this.eventEmitter.emit('config', { text: 'Config: Wrong format area' });      
      return;
    }

    var postData = JSON.stringify({
      'modelType':'Full',
      'Downsample': false,
      'geometry': geometry
    });

    var options = {
      host: 'live.ais.barentswatch.no',
      port: 443,
      path: '/v1/combined',
      method: 'POST',
      timeout: 300000,
      headers: { 'Authorization': "Bearer " + token, 
                'Content-Type': "application/json",
                'Content-Length': Buffer.byteLength(postData) }
    };

    var req = https.request(options, function(res) {
      var chunks = [];
      res.setEncoding('utf8');
      aisObj.logger('AIS request: ' + res.statusCode);
      
      if(res.statusCode == 401) {
        aisObj.logger('need new bearer token');
        this.fetchNewBearerToken = true;
      }
      res.on('data', function (chunk) {
        if(res.statusCode == 200) {
          chunks.push(Buffer.from(chunk));
          aisObj.lastAisData = Date.now();
          aisObj.eventEmitter.emit('ais', chunk);
        }
      });
      res.on('end', function () {
        if(res.statusCode == 200) {
          var body = Buffer.concat(chunks).toString('utf8');
          aisObj.logger("body: " + body);
          aisObj.logger("ending AIS request");
        } else {
          aisObj.eventEmitter.emit('config', { text: 'Config: Failed AIS request, check area' });   
        }
        aisObj.waitingForAis = false;
      });
    });

    req.on('timeout', () => {
      req.destroy();
      aisObj.logger("AIS request timed out");
      aisObj.waitingForAis = false;
    });

    req.on('close', () => {
      req.destroy();
      aisObj.logger("AIS request closed");
      aisObj.waitingForAis = false;
    });

    req.on('error', function(e) {
      aisObj.logger('problem with request: ' + e.message);
      aisObj.waitingForAis = false;
    });
    req.write(postData);
    req.end();
  }

}

module.exports = AisFetcher;
