With "Passing Ships," you can receive notifications when ships enter a selected geographical area. The solution uses Norwegian AIS data.

This is a first version, and if interest and time align, more features may be added eventually. Until version 1.0.0, flows may change.

To make it work, you need to add a device. As of today, you can only add one device.

The following configurations can/must be set up on the device:

You must enter a "ClientID" and "ClientSecret." You create these on MyPage at Barentswatch. This provides access to the Norwegian Coastal Administration's AIS data.
-- Go to: https://www.barentswatch.no/minside/
-- Set up a new client. Choose a client name; the Client Type should be AIS-Data. Enter a password (ClientSecret).
-- Enter ClientID (your@email.com:clientname) and ClientSecret (the password you just set up).

You can choose to override your location. Initially, your Homey's location is used.

You must enter a GeoJSON that describes the area you will monitor. This should not be too large. The intention is for you to monitor what you see from your Homey location. The format for this is: { "type": "Polygon", "coordinates": [ [ [ 6.184478066111999, 62.474786444721374 ], [ 6.183887242493443, 62.496939442347866 ], [ 6.295995708367114, 62.498287166356747 ], [ 6.302261762396829, 62.466357084842059 ], [ 6.184478066111999, 62.474786444721374 ] ] ] }
-- Go to kystinfo.no. Zoom so that you see your area (not too large...)
-- Select "Draw and measure" on the right. Then choose Polygon.
-- Click on the map to set points. Double-click on the first point to finish.
-- Export (see at the very bottom right) as GeoJSON.
-- You should insert part of the GeoJSON into the configuration. Refer to the example and match the format.

Data is retrieved from the Norwegian Coastal Administration via Barentswatch's Live AIS API.

Source code is available here: https://github.com/arneunneland/homey-passing-ships