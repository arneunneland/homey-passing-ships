'use strict';

const EventEmitter = require('events');
const AisFetcher = require('./aisFetcher.js');

class AisWatcher {
  constructor(homey, logger, latitude, longitude, clientId, clientSecret, area) {
    this.eventEmitter = new EventEmitter()
    this.homey = homey;
    this.logger = logger;
    this.latitude = latitude;
    this.longitude = longitude;
    this.ships = new Map();

    this.aisFetcher = new AisFetcher(this.homey, this.logger, clientId, clientSecret, area);

    this.aisFetcher.eventEmitter.on('config', async (data) => {
      this.eventEmitter.emit('config', data);
    });

    this.aisFetcher.eventEmitter.on('ais', async (data) => {
      this.handleAisString(data);
    });
  }

  destroy() {
    this.aisFetcher.destroy();
  }
  
  updateSettings(latitude, longitude, clientId, clientSecret, area) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.aisFetcher.updateSettings(clientId, clientSecret, area);
    this.aisFetcher.updateData();
  }

  // Converts from radians to degrees.
  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  bearing(startLat, startLng, destLat, destLng){
    startLat = this.deg2rad(startLat);
    startLng = this.deg2rad(startLng);
    destLat = this.deg2rad(destLat);
    destLng = this.deg2rad(destLng);

    var y = Math.sin(destLng - startLng) * Math.cos(destLat);
    var x = Math.cos(startLat) * Math.sin(destLat) -
          Math.sin(startLat) * Math.cos(destLat) * Math.cos(destLng - startLng);
    var brng = Math.atan2(y, x);
    brng = this.toDegrees(brng);
    return (brng + 360) % 360;
  }

  getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
    var dLon = this.deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    return d;
  }
  
  deg2rad(deg) {
    return deg * (Math.PI/180)
  }
  
  getCourse(course)
  {
    // define our values
    var degs = 360;
    //var strs = ["N","NNØ","NØ","ØNØ","Ø","ØSØ","SØ","SSØ","S","SSV","SV","VSV","V","VNV","NV","NNV"];
    var strs = ["N","NØ","Ø","SØ","S","SV","V","NV"];
    // get the step amount based on the number of compass headings we have
    var step = degs/strs.length;

    var adjustedCourse = course + Math.floor(step/2);
    // make sure course is always within the expected range in case it is incremented past 360
    var adjustedCourseInRange = adjustedCourse % degs;
    
    // now just divide the course by the step and read off the relevant heading
    var index = Math.floor(adjustedCourseInRange / step);
    return (strs[index] ? strs[index] : "-");
  }

  handleAisString(aisText) {
    aisText.split("\n").forEach((line, index) => {
      if (line.length > 10 ) {
        try {
          var aisData = JSON.parse(line);
          this.handleAis(aisData);
        } catch (error) {
          this.logger("Error parsing AIS data: " + error + ";" + line);
        }
      }
    });
        
  }

  handleAis(aisData) {
    aisData.distance = this.getDistanceFromLatLonInKm(this.latitude, this.longitude, aisData.latitude, aisData.longitude);
    aisData.bearing = this.bearing(this.latitude, this.longitude, aisData.latitude, aisData.longitude);
    aisData.bearingAsText = this.getCourse(Math.trunc(aisData.bearing));
    aisData.comingFromAsText = this.getCourse(aisData.courseOverGround + 180 % 360);
    aisData.localTime = Date.parse(aisData.msgtime);
    if (aisData.courseOverGround) {
      aisData.courseAsText = this.getCourse(Math.trunc(aisData.courseOverGround));
    } else {
      aisData.courseAsText = "-";
    }
    this.logger("AIS: " + aisData.name + ", " + aisData.bearing.toFixed(2) + ", " + aisData.bearingAsText + ", " + aisData.distance.toFixed(2) + ", " + aisData.speedOverGround + ", " + aisData.courseOverGround + ", " + aisData.courseAsText);
    
    if (+aisData.speedOverGround > 0.2) {
      if (!this.ships.has(aisData.mmsi)) {
          this.triggerNewShip(aisData, false);
      } else {
        var oldAisData = this.ships.get(aisData.mmsi);
        if (+oldAisData.speedOverGround <= 0.2) {
          this.triggerNewShip(aisData, true);
        }
      }
    }
    this.ships.set(aisData.mmsi, aisData);

    for (var [key, value] of this.ships) {
      if(Date.now() - value.localTime > 180000) {
        this.ships.delete(key);
      }
    }
    this.publishEvent();
  }

  triggerNewShip(aisData, wasStopped) {
    this.logger("Detected new ship: " + aisData.name + ", " + aisData.bearing.toFixed(2) + ", " + aisData.bearingAsText + ", " + aisData.distance.toFixed(2) + ", " + aisData.speedOverGround + ", " + aisData.courseOverGround + ", " + aisData.courseAsText);

    var data = { 
        name: aisData.name, 
        course: aisData.courseAsText, 
        comingFrom: aisData.comingFromAsText,
        speed: aisData.speedOverGround, 
        length: aisData.shipLength,
        wasStopped: wasStopped
      };
    this.eventEmitter.emit('passingship', data);
  }

  shipTypeAsText(shipType) {
    const shipTypeCodeMap = new Map([
      [0, "Ikke tilgjengelig (standard)"],
      ...Array.from({ length: 19 }, (_, i) => [i + 1, "Reservert for fremtidig bruk"]),
      ...Array.from({ length: 10 }, (_, i) => [i + 20, "Ving i bakken (WIG)"]),
      [30, "Fiske"],
      [31, "Sleping"],
      [32, "Sleping"],
      [33, "Mudring / undervannsarbeid"],
      [34, "Dykkeoperasjoner"],
      [35, "Militære operasjoner"],
      [36, "Seiling"],
      [37, "Fritidsbåt"],
      [38, "Reservert"],
      [39, "Reservert"],
      ...Array.from({ length: 10 }, (_, i) => [i + 40, "Høyhastighetsskip (HSC)"]),
      [50, "Losbåt"],
      [51, "Søk og redning"],
      [52, "Slepebåt"],
      [53, "Havnetjeneste"],
      [54, "Forurensningsbekjempelsesutstyr"],
      [55, "Lovhåndhevelse"],
      [56, "Reserve - Lokalt fartøy"],
      [57, "Reserve - Lokalt fartøy"],
      [58, "Medisinsk transport"],
      [59, "Ikke-krigførende skip"],
      ...Array.from({ length: 10 }, (_, i) => [i + 60, "Passasjer"]),
      ...Array.from({ length: 10 }, (_, i) => [i + 70, "Lasteskip"]),
      ...Array.from({ length: 10 }, (_, i) => [i + 80, "Tankskip"]),
      ...Array.from({ length: 10 }, (_, i) => [i + 90, "Annen type"]),
    ]);
    if (shipTypeCodeMap.has(shipType)) {
      return shipTypeCodeMap.get(shipType);
    }
    return "";
  }

  publishEvent() {
    const pad = (i) => (i < 10) ? "0" + i : "" + i;
    const currentTime = new Date();
    var lastStatus = pad(currentTime.getHours()) + ":" + pad(currentTime.getMinutes()) + ":" + pad(currentTime.getSeconds());

    var closestShip = null;
    var closestShipCourse = null;
    var closestShipDistance = 1000;
    var currentMovingShips = 0;
    var closestShipBearing = "-";
    var numberOfShips = this.ships.size;

    for (var [key, value] of this.ships) {
      if (+value.speedOverGround > 0.2) {
        currentMovingShips++;
        if (value.distance < closestShipDistance) {
          closestShip = value;
          closestShipCourse = value.courseAsText + " " + value.speedOverGround + " kn";
          closestShipBearing = value.bearingAsText + " " + Math.round(value.distance * 100) / 100 + " km";
        }
      }
    }
    this.eventEmitter.emit('update', { 
      numberOfShips: numberOfShips, 
      lastStatus: lastStatus, 
      closestShip: (closestShip ? closestShip.name : "-"),
      length: (closestShip ? closestShip.shipLength : null),
      width: (closestShip ? closestShip.shipWidth : null),
      destination: (closestShip ? closestShip.destination : "-"),
      shipTypeAsText: (closestShip ? this.shipTypeAsText(closestShip.shipType) : "-"), 
      currentMovingShips: currentMovingShips, 
      closestShipCourse: closestShipCourse, 
      closestShipBearing: closestShipBearing
    });
  }

}

module.exports = AisWatcher;

