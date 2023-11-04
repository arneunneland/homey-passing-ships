With "Passing Ships," you can receive notifications when ships enter a selected geographical area. The solution uses Norwegian AIS data.

This is a first version, and if interest and time align, more features may be added eventually. Until version 1.0.0, flows may change.

To make it work, you need to add a area to check for ships. You can add up to three areas. They should not be to large.

To make a shiparea work you must:
- Provide a clientId and a clientSecret to Barentswatch API. This provides access to the Norwegian Coastal Administration AIS data.
- Set up a name and area. The area is drawn as a polygon in a map. If it fail's try again..
- You can choose to override your location. Initially, your Homey's location is used.

Data is retrieved from the Norwegian Coastal Administration via Barentswatch's Live AIS API.

Source code is available here: https://github.com/arneunneland/homey-passing-ships