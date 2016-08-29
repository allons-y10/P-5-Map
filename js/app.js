//** model **\\
//points of interest in Ventura
var locations = [
          {title: 'In-N-Out Burger', location: {lat: 34.268384, lng: -119.272895}},
          {title: "Pete's Breakfast House", location: {lat: 34.278077, lng: -119.269555}},
          {title: "Allison's Country Cafe", location: {lat: 34.273173, lng: -119.249263}},
          {title: 'Ventura Beach Marriott', location: {lat: 34.268859, lng: -119.273858}},
          {title: 'Arroyo Verde Park', location: {lat: 34.286451, lng: -119.22663}},
          {title: 'Grant Park', location: {lat: 34.286323, lng: -119.291635 }},
          {title: 'West main bike Path', location: {lat: 34.281496, lng: -119.30618 }},
          {title: 'Ventura Pier', location: {lat: 34.275067, lng: -119.290962}},
          {title: 'Ventura Beach', location: {lat: 34.240035, lng: -119.265579}},
          {title: 'Camino Real Park Tennis Courts', location: {lat: 34.269431, lng: -119.234076}}
        ];
var map;
var markers = [];
var largeInfoWindow;

//styles from snazymaps.com
var styles = [
    {
        "featureType": "landscape",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#e9e5dc"
            }
        ]
    },
    {
        "featureType": "landscape.natural.terrain",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#44a04b"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#7bb718"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#a3a2a2"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#0099dd"
            }
        ]
    }
];

//** view **\\
      //initializes the map on screen
      function initMap() {
        // starts on Ventura - only center and zoom are required.
        map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 34.274646, lng: -119.229032},
          zoom: 13,
          styles: styles
        });

        // This autocomplete is for use in the search within time entry box.
        var timeAutocomplete = new google.maps.places.Autocomplete(
            document.getElementById('search-within-time-text'));
        // This autocomplete is for use in the geocoder entry box.
        var zoomAutocomplete = new google.maps.places.Autocomplete(
            document.getElementById('zoom-to-area-text'));
        //Bias the boundaries within the map for the zoom to area text.
        zoomAutocomplete.bindTo('bounds', map);

      largeInfoWindow = new google.maps.InfoWindow();

      // Style the markers a bit. This will be our listing marker icon.
      var defaultIcon = makeMarkerIcon('0091ff');

      // Create a "highlighted location" marker color for when the user
      // mouses over the marker.
      var highlightedIcon = makeMarkerIcon('FFFF24');

      //for-loop to go through locations array
      for (var i = 0; i < locations.length; i++) {
          // Get the position from the location array.
          var position = locations[i].location;
          var title = locations[i].title;
          // Create a marker per location, and put into markers array.
           var marker = new google.maps.Marker({
            position: position,
            map: map,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: i
          });
          // Push the marker to our array of markers.
          markers.push(marker);
          // Create an onclick event to open an infowindow at each marker.
          marker.addListener('click', function() {
            /*populateInfoWindow*/getFSinfo(this, largeInfoWindow);
          });
          markers[i].setMap(map);
          // Two event listeners - one for mouseover, one for mouseout,
          // to change the colors back and forth.
          marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
          });
          marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
          });
        }

        document.getElementById('show-listings').addEventListener('click', showListings);
        document.getElementById('hide-listings').addEventListener('click', hideListings);
        document.getElementById('zoom-to-area').addEventListener('click', function() {
            zoomToArea();
        });
        document.getElementById('search-within-time').addEventListener('click', function() {
            searchWithinTime();
        });
      }

      // This function populates the infowindow when the marker is clicked. We'll only allow
      // one infowindow which will open at the marker that is clicked, and populate based
      // on that markers position.
      function populateInfoWindow(marker, infowindow) {
        // Check to make sure the infowindow is not already opened on this marker.
        if (infowindow.marker != marker) {
          // Clear the infowindow content to give the streetview time to load.
          infowindow.setContent('');
          infowindow.marker = marker;
          // Make sure the marker property is cleared if the infowindow is closed.
          infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
          });
          var streetViewService = new google.maps.StreetViewService();
          var radius = 50;
          // In case the status is OK, which means the pano was found, compute the
          // position of the streetview image, then calculate the heading, then get a
          // panorama from that and set the options
          function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
              var nearStreetViewLocation = data.location.latLng;
              var heading = google.maps.geometry.spherical.computeHeading(
                nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                  position: nearStreetViewLocation,
                  pov: {
                    heading: heading,
                    pitch: 30
                  }
                };
              var panorama = new google.maps.StreetViewPanorama(
                document.getElementById('pano'), panoramaOptions);
            } else {
              infowindow.setContent('<div>' + marker.title + '</div>' +
                '<div>No Street View Found</div>');
            }
          }
          // Use streetview service to get the closest streetview image within
          // 50 meters of the markers position
          streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
          // Open the infowindow on the correct marker.
          infowindow.open(map, marker);
        }
      }

      // This function will loop through the markers array and display them all.
      function showListings() {
        var bounds = new google.maps.LatLngBounds();
        // Extend the boundaries of the map for each marker and display the marker
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(map);
          bounds.extend(markers[i].position);
        }
        map.fitBounds(bounds);
      }

      // This function will loop through the listings and hide them all.
      function hideListings() {
        for (var i = 0; i < markers.length; i++) {
          markers[i].setMap(null);
        }
      }

      // This function takes in a COLOR, and then creates a new marker
      // icon of that color. The icon will be 21 px wide by 34 high, have an origin
      // of 0, 0 and be anchored at 10, 34).
      function makeMarkerIcon(markerColor) {
        var markerImage = new google.maps.MarkerImage(
          'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
          '|40|_|%E2%80%A2',
          new google.maps.Size(21, 34),
          new google.maps.Point(0, 0),
          new google.maps.Point(10, 34),
          new google.maps.Size(21,34));
        return markerImage;
      };
      // This function takes the input value in the find nearby area text input
      // locates it, and then zooms into that area. This is so that the user can
      // show all listings, then decide to focus on one area of the map.
      function zoomToArea() {
        // Initialize the geocoder.
        var geocoder = new google.maps.Geocoder();
        // Get the address or place that the user entered.
        var address = document.getElementById('zoom-to-area-text').value;
        // Make sure the address isn't blank.
        if (address == '') {
          window.alert('You must enter an area, or address.');
        } else {
          // Geocode the address/area entered to get the center. Then, center the map
          // on it and zoom in
          geocoder.geocode(
            { address: address,
              componentRestrictions: {locality: 'Ventura'}
            }, function(results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
              } else {
                window.alert('We could not find that location - try entering a more' +
                    ' specific place.');
              }
            });
      }
  }

  // This function allows the user to input a desired travel time, in
      // minutes, and a travel mode, and a location - and only show the listings
      // that are within that travel time (via that travel mode) of the location
      function searchWithinTime() {
        // Initialize the distance matrix service.
        var distanceMatrixService = new google.maps.DistanceMatrixService;
        var address = document.getElementById('search-within-time-text').value;
        // Check to make sure the place entered isn't blank.
        if (address == '') {
          window.alert('You must enter an address.');
        } else {
          hideListings();
          // Use the distance matrix service to calculate the duration of the
          // routes between all our markers, and the destination address entered
          // by the user. Then put all the origins into an origin matrix.
          var origins = [];
          for (var i = 0; i < markers.length; i++) {
            origins[i] = markers[i].position;
          }
          var destination = address;
          var mode = document.getElementById('mode').value;
          // Now that both the origins and destination are defined, get all the
          // info for the distances between them.
          distanceMatrixService.getDistanceMatrix({
            origins: origins,
            destinations: [destination],
            travelMode: google.maps.TravelMode[mode],
            unitSystem: google.maps.UnitSystem.IMPERIAL,
          }, function(response, status) {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
              window.alert('Error was: ' + status);
            } else {
              displayMarkersWithinTime(response);
            }
          });
        }
      }

      // This function will go through each of the results, and,
      // if the distance is LESS than the value in the picker, show it on the map.
      function displayMarkersWithinTime(response) {
        var maxDuration = document.getElementById('max-duration').value;
        var origins = response.originAddresses;
        var destinations = response.destinationAddresses;
        // Parse through the results, and get the distance and duration of each.
        // Because there might be  multiple origins and destinations we have a nested loop
        // Then, make sure at least 1 result was found.
        var atLeastOne = false;
        for (var i = 0; i < origins.length; i++) {
          var results = response.rows[i].elements;
          for (var j = 0; j < results.length; j++) {
            var element = results[j];
            if (element.status === "OK") {
              // The distance is returned in feet, but the TEXT is in miles. If we wanted to switch
              // the function to show markers within a user-entered DISTANCE, we would need the
              // value for distance, but for now we only need the text.
              var distanceText = element.distance.text;
              // Duration value is given in seconds so we make it MINUTES. We need both the value
              // and the text.
              var duration = element.duration.value / 60;
              var durationText = element.duration.text;
              if (duration <= maxDuration) {
                //the origin [i] should = the markers[i]
                markers[i].setMap(map);
                atLeastOne = true;
                // Create a mini infowindow to open immediately and contain the
                // distance and duration
                var infowindow = new google.maps.InfoWindow({
                  content: durationText + ' away, ' + distanceText
                });
                infowindow.open(map, markers[i]);
                // Put this in so that this small window closes if the user clicks
                // the marker, when the big infowindow opens
                markers[i].infowindow = infowindow;
                google.maps.event.addListener(markers[i], 'click', function() {
                  this.infowindow.close();
                });
              }
            }
          }
        }
        if (!atLeastOne) {
          window.alert('We could not find any locations within that distance!');
        }
      }

      var Loc = function(data) {
       this.title = ko.observable(data.title);
       this.location = ko.observable(data.location);
       this.marker = ko.observable(data.marker);
       this.infoWindow = ko.observable(data.infoWindow);

       this.showWin = function() {
        this.infoWindow().open(map, this.marker());
        this.marker().animate();
       }
   }


//** ViewModel **\\
      var ViewModel = function() {
        var self = this;

        var newList

        this.locList = ko.observableArray([]);

        this.filterValue = ko.observable("");

        this.masterList = ko.computed(function() {
            newList = []
            locations.forEach(function(LocItem) {
                if (LocItem.title.toLowerCase().includes(self.filterValue().toLowerCase())) {
                    newList.push(new Loc(LocItem));
                }
            });

            if (markers.length > 0) {
                markers.forEach(function(marker) {
                    if (marker.title.toLowerCase().includes(self.filterValue().toLowerCase())) {
                        marker.setMap(map);
                    } else {
                        marker.setMap(null);
                    }
                });
            }
            return newList;
        }, this);

        //locations.forEach(function(LocItem) {
            //self.locList.push(new Loc(LocItem));
            //console.log(LocItem);
        //});

        //console.log(locations[0].location.lat);
/*foursquare API request*/
  //(function() {
      self.fsLocations = ko.observableArray(locations);
      //console.log(self.fsLocations);

     function getFSinfo(location) {
      var clientID = 'JS1EBO3RLBZPWCVMMJXNEPIDRMZXHM0ISZ54R0SWOKTPLPJN';
      var ClientSec = '1VY312WE5KJBSOO4JD0UDLQV51III51AJ5T1RVGP0AZPHBE5';
      var api = 'https://api.foursquare.com/v2/venues/search';
      var version = 'v=20130815';
      var llLat;
      var llLng;
      var errorMsg;
      var rsp;

         llLat = location.location.lat;
         llLng = location.location.lng;
      //var latlng = markers.position;
      var fsApi = api + '?client_id=' + clientID + '&' + 'client_secret=' + ClientSec + '&' + version + '&ll=' + llLat +',' + llLng;
      console.log();
      $.ajax({
         url: fsApi,
         datatype: 'jsonp',
         success: function(response) {
            rsp = response.response.groups[0].items[0].venue;
            console.log(rsp);

            infoWindow.setContent('< href="' + location.fsApi + '">' + rsp.name + '</a>' + '<br>' + location.phone + '<br>');

            infoWindow.open(map, location.marker);
         }
            });

}





}




      ko.applyBindings(new ViewModel());


