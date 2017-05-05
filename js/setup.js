
var app = {
  apikey: "1adccecafb0cffe8074ab6c9611a1f8293439f407",
  map: L.map('map', { center: [38.891293, -77.036291], zoom: 12 }),
  geojsonClient: new cartodb.SQL({ user: 'jtoups', format: 'geojson' }),
  drawnItems: new L.FeatureGroup()
};

L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
}).addTo(app.map);
var metroLines;
var metroStations;
var apartments;
var lineLayer;
var stationLayer;
var aptLayer;
var ndist = {};
var nbed = {};
var nbath = {};
var nmin = {};
var nmax = {}
var npark = {};
var isPark = false;
var nlines = {};
var walkBuffer;
var filterStations;
var insideBuffer;
var displayedLine;
var finalPoints;

// This plots ALL of the data on the map
app.geojsonClient.execute("SELECT *FROM metro_lines_regional")
  .done(function(data) {
    metroLines = data;
    lineLayer = L.geoJson(data, {
      style: function(feature){
        switch (feature.properties.name){
          case 'red': return {color:"#FC0000"};
          case 'orange': return {color:"#FC9C00"};
          case 'blue': return {color:"#5165C5"};
          case 'green': return {color:"#25C114"};
          case 'silver': return {color:"#969697"};
          case 'yellow': return {color:"#FCD900"};
          case 'orange - rush +': return {color:"#FC9C00"};
          case 'yellow - rush +': return {color:"#FCD900"};
        }
      }
    }).addTo(app.map);
  })
  .error(function(errors) {
  });

app.geojsonClient.execute("SELECT *FROM metro_stations_regional")
    .done(function(data) {
      metroStations = data;
      stationLayer = L.geoJson(data,
        {pointToLayer: function(geoJsonPoint, latlng){
          var stationIcon = L.Icon({
            iconUrl:'js/stationicon-01.png'
          });
          return L.marker(latlng, {icon:stationIcon});
        }
      });
      stationLayer.addTo(app.map);
    })



app.geojsonClient.execute("SELECT *FROM final_rental_data")
      .done(function(data) {
        apartments = data;
        console.log(apartments)
        aptLayer = L.geoJson(data, {
        }).addTo(app.map);
      })
      .error(function(errors) {
      });

// What happens when homie clicks submit

$("#submitbutton").click(function () {
  app.map.removeLayer(lineLayer);
  app.map.removeLayer(stationLayer);
  app.map.removeLayer(aptLayer);
  if(finalPoints){
  app.map.removeLayer(finalPoints);
}
  console.log("deleting");
});


//Second, convert user input into variables for SQL inquiries

$("#submitbutton").click(function(){
ndist = $("#distance").val();});

$("#submitbutton").click(function(){
nbed = $("#bed").val();});

$("#submitbutton").click(function(){
nbath = $("#bath").val();});

$("#submitbutton").click(function(){
nmin = $("#minPrice").val() || 0;});

$("#submitbutton").click(function(){
nmax = $("#maxPrice").val() || 5000;});

$("#car").change(function(e){
  isPark =($(this).prop("checked"));
  // console.log(isPark);
  if(isPark == false) {
    $(this).val("true");
    // console.log(isPark);
  }else {
    $(this).val("false");

  }
  console.log($(this).prop("checked"));
});

// $("#submitbutton").click(function(){
// // nlines = $(".linechoice").prop("id");
// });

$('.linechoice').change(function(e){
  nlines = this.id;
})

// Filter stations by line selection, Create a buffer!

$("#submitbutton").click(function(){
  console.log(metroStations);
  filterStations =_.filter(metroStations.features, function(b){
    return b.properties.line.includes(nlines);
  });
  console.log(filterStations);

  walkBuffer = _.map(filterStations, function(b){
    // L.geoJson(turf.buffer(b, ndist, 'miles')).addTo(app.map);
    return turf.buffer(b,ndist,'miles');
  })
  console.log(walkBuffer)

  insideBuffer = _.filter(apartments.features, function(eachApt){

    var isWithin = false;

    _.each(walkBuffer, function(eachBuffer){
      if(turf.inside(turf.point(eachApt.geometry.coordinates), turf.polygon(eachBuffer.geometry.coordinates))){
        isWithin = true;
      }
    })
    return isWithin;
  })


  // console.log(insideBuffer);
  console.log("Assigning!")
  finalPoints = _.filter(insideBuffer, function(eachApt){
    return eachApt.properties.bed >= nbed && eachApt.properties.bath >= nbath && eachApt.properties.rent_price >=nmin && eachApt.properties.rent_price <= nmax
    && eachApt.properties.park_true_false == isPark
    // console.log(isPark);
    // nbath && eachApt.properties.rent_price >= nmin && eachApt.properties.rent_price <= nmax
  });

  console.log(finalPoints);
  L.geoJson(finalPoints).addTo(app.map);

  // finalPoints = _.filter(insideBuffer, function(eachApt){
  //   return eachApt.xx == variable1 &&  eachApt.yy == variable2
  // })
  //
  // plot finalPoints


//to put the lines and stations of the desired line back on the map.
  displayedLine =_.filter(metroLines.features, function(J){
  return J.properties.name.includes(nlines)});

  L.geoJson(displayedLine, {
    style: function(feature){
      switch(feature.properties.name){
        case 'red': return {color:"#FC0000"};
        case 'orange': return {color:"#FC9C00"};
        case 'blue': return {color:"#5165C5"};
        case 'green': return {color:"#25C114"};
        case 'silver': return {color:"#969697"};
        case 'yellow': return {color:"#FCD900"};
        case 'orange - rush +': return {color:"#FC9C00"};
        case 'yellow - rush +': return {color:"#FCD900"};
      }
    }
  }).addTo(app.map);







  // _.each(walkbuffer,
  //   L.marker())
// This is the end of the click event, don't touch!
});

  // _.filter()



// These are practice console logs from earlier testing

// $("#submitbutton").click(function(){
// console.log($("#distance").val());});
//
// $("#submitbutton").click(function(){
// console.log($("#bed").val());});
//
// $("#submitbutton").click(function(){
// console.log($("#bath").val());});
//
// $("#submitbutton").click(function(){
// console.log($("#minPrice").val());});
//
// $("#submitbutton").click(function(){
// console.log($("#maxPrice").val());});

//Third, filter housing results by housing requirements
// $("#submitbutton").click(function(){
// app.geojsonClient.execute("SELECT *FROM final_rental_data")
//       .done(function(data) {
//         L.geoJson(data, {
//         }).addTo(app.map);
//       })
//       .error(function(errors) {
//       })};

// Leaflet draw setup
// app.map.addLayer(app.drawnItems);
//
//
//
//
// // Handling the creation of Leaflet.Draw layers
// // Note the use of drawnLayerID - this is the way you should approach remembering and removing layers
// var drawnLayerID;
// app.map.on('draw:created', function (e) {
//   var type = e.layerType;
//   var layer = e.layer;
//   console.log('draw created:', e);
// });
