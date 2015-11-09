/*************************************************************************
 * SCC330 Network Studio - Team 2 - JALP SmartLab
 *
 *************************************************************************
 *
 * @author
 * Anson Cheung
 * Josh Stennett
 *************************************************************************/

//modules
var spotApp = angular.module('spotApp', ['ngRoute', 'ngResource', 'firebase', 'googlechart', 'ngDialog']);
var ref = new Firebase("https://sunsspot.firebaseio.com");
var spotSettingsRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings");

//Routes
spotApp.config(function($routeProvider, $locationProvider) {
    $routeProvider

        .when('/', {
            templateUrl: 'pages/smartlab.html',
            controller: 'smartlabController'
        })
        .when('/map', {
            templateUrl: 'pages/map.html',
            controller: 'mapController'
        })
        .when('/history', {
            templateUrl: 'pages/history.html',
            controller: 'historyController'
        })
        .otherwise({
            redirectTo: '/'
        });

    // $locationProvider.html5Mode(true).hashPrefix('!');
});

//Think it as global variables
spotApp.run(function($rootScope, $firebaseObject) {
    $rootScope.appName = 'JALP SmartLab';

    $rootScope.livedata = $firebaseObject(ref.child('zone1').limitToLast(1));
    $rootScope.livedata2 = $firebaseObject(ref.child('zone2').limitToLast(1));
    $rootScope.livedata3 = $firebaseObject(ref.child('zone3').limitToLast(1));

    $rootScope.zone1hourly = $firebaseObject(ref.child('zone1hourly'));
    $rootScope.zone2hourly = $firebaseObject(ref.child('zone2hourly'));
    $rootScope.zone3hourly = $firebaseObject(ref.child('zone3hourly'));

    /**
     * Set chart options
     * @param {String} chartType - Could be Gauge or {..haven't implemented other graph options}
     * @param {object} chartObject
     * @param {String} type = Could be either 'light' or 'temp'(Temperature)
     * @author Anson Cheung
     */
    $rootScope.setChart = function(chartType, chartObject, type) {

        chartObject.type = chartType;

        if (type === 'light') {
            chartObject.options = {
                max: 3000,
                width: 400,
                height: 120,
                yellowFrom: 1000,
                yellowTo: 1500,
                redFrom: 1500,
                redTo: 3000,
                minorTicks: 5,
                animation: {
                    duration: 1000,
                    easing: 'out',
                }
            };
        }
        if (type === 'temp') {
            chartObject.options = {
                max: 60,
                width: 400,
                height: 120,
                yellowFrom: 20,
                yellowTo: 40,
                redFrom: 40,
                redTo: 60,
                minorTicks: 5,
                animation: {
                    duration: 1000,
                    easing: 'out',
                }
            };
        }

    }

    /**
       * Listens to the objects
       * @param {type} paramName - Description.
       * @author Anson Cheung
       */
    $rootScope.listenLive = function(childName, object, type) {
        ref.child(childName).limitToLast(1).on('child_added', function(snapshot) {
            var data = snapshot.val();
            var light = Math.round(data.light * 100) / 100; //Round up to 2 decimal places
            var temp = Math.round(data.temp * 100) / 100; //Round up to 2 decimal places

            if (type === 'light') {
                object.data = [
                    ['Label', 'Value'],
                    ['Light (lm)', light]
                ];
            }

            if (type === 'temp') {
                object.data = [
                    ['Label', 'Value'],
                    ['Temp (℃)', temp]
                ];
            }
        });
    }

    /**
       * DESCRIPTION
       * @param {type} paramName - Description.
       * @author Anson Cheung
       */
    $rootScope.pushData = function(childName, object, type) {
        ref.child(childName).on("value", function(snapshot) {
            snapshot.forEach(function(data) {
                var timestamp = new Date(data.val().timestamp);

                if (type === 'light') {
                    object.data.rows.push({
                        c: [{
                            v: new Date(timestamp)
                        }, {
                            v: data.val().light
                        }, ]
                    });
                }

                if (type === 'temp') {
                    object.data.rows.push({
                        c: [{
                            v: new Date(timestamp)
                        }, {
                            v: data.val().temp
                        }, ]
                    });
                }

            });
        });
    }



    /*----- LIVE DATA PAGE -----*/
    var liveZoneLight = [];
    var liveZoneTemp = [];

    for (i = 0; i < 3; i++) {

        //Light
        liveZoneLight[i] = {};
        $rootScope.setChart('Gauge', liveZoneLight[i], 'light');
        $rootScope.listenLive('zone' + (i + 1), liveZoneLight[i], 'light');

        //Temperature
        liveZoneTemp[i] = {};
        $rootScope.setChart('Gauge', liveZoneTemp[i], 'temp');
        $rootScope.listenLive('zone' + (i + 1), liveZoneTemp[i], 'temp');

    }

    //Zone 1 Light & Temp
    $rootScope.liveLight1 = liveZoneLight[0];
    $rootScope.liveTemp1 = liveZoneTemp[0];

    //Zone 2 Light & Temp
    $rootScope.liveLight2 = liveZoneLight[1];
    $rootScope.liveTemp2 = liveZoneTemp[1];

    //Zone 3 Light & Temp
    $rootScope.liveLight3 = liveZoneLight[2];
    $rootScope.liveTemp3 = liveZoneTemp[2];


    /*----- HISTORY PAGE -----*/
    var zoneLight = [];
    var zoneTemp = [];

    for (i = 0; i < 3; i++) {
        //Zone's light
        zoneLight[i] = {};

        zoneLight[i].type = "AnnotationChart";

        zoneLight[i].data = {
            "cols": [{
                id: "week",
                label: "Week",
                type: "date"
            }, {
                id: "light-data",
                label: "Light (lm)",
                type: "number"
            }],
            "rows": []
        };

        $rootScope.pushData('zone' + (i + 1) + 'hourly', zoneLight[i], 'light');

        zoneLight[i].options = {
            displayAnnotations: true,
            zoomButtonsOrder: ['1-hour', 'max'],
            height:400
        };

        //Zone's Temperature
        zoneTemp[i] = {};

        zoneTemp[i].type = "AnnotationChart";

        zoneTemp[i].data = {
            "cols": [{
                id: "week",
                label: "Week",
                type: "date"
            }, {
                id: "temp-data",
                label: "Temp (℃)",
                type: "number"
            }],
            "rows": []
        };

        $rootScope.pushData('zone' + (i + 1) + 'hourly', zoneTemp[i], 'temp');

        zoneTemp[i].options = {
            displayAnnotations: true,
            zoomButtonsOrder: ['1-hour', 'max'],
            colors: ['#FF0000', '#FF0000', '#FF0000'],
            height:400
        };
    }

    $rootScope.zone1light = zoneLight[0];
    $rootScope.zone2light = zoneLight[1];
    $rootScope.zone3light = zoneLight[2];

    $rootScope.zone1temp = zoneTemp[0];
    $rootScope.zone2temp = zoneTemp[1];
    $rootScope.zone3temp = zoneTemp[2];

    //-----------------------------------//
    //############# TESTING #############//
    //########## DONT DELETE ############//
    //-----------------------------------//
    // var liveLightTest = {};
    // liveLightTest.type = "AnnotationChart";

    // liveLightTest.data = {
    //     "cols": [{
    //         id: "week",
    //         label: "Week",
    //         type: "date"
    //     }, {
    //         id: "value-data",
    //         label: "Value",
    //         type: "number"
    //     }],
    //     "rows": []
    // };

    // spotTest.on('child_added', function(snapshot) {
    //     var data = snapshot.val();
    //     var timestamp = new Date(data.timestamp);

    //     liveLightTest.data.rows.push({
    //         c: [{
    //             v: new Date(timestamp)
    //         }, {
    //             v: data.newVal
    //         }, ]
    //     });


    // });

    // liveLightTest.options = {
    //     displayAnnotations: false,
    //     zoomButtonsOrder: ['1-hour', 'max'],
    //     colors: ['#00FF00', '#00FF00', '#00FF00']
    // };

    // $rootScope.liveLightTest = liveLightTest;
    //-----------------------------------//
    //########### TESTING END ###########//
    //########## DONT DELETE ############//
    //-----------------------------------//

})


//smart lab Controller
spotApp.controller('smartlabController', ['$rootScope', '$scope','$firebaseObject', '$parse', 'ngDialog',
function($rootScope, $scope, $firebaseObject, $parse, ngDialog) {

    /**
     * Generate a annotation graph and set it to a <div>
     * @constructor
     * @param {int} zoneNumber - Zone number.
     * @param {String} graphType - Either 'light' or 'temp'.
     * @param {string} bindDivName - The author of the book.
     * @author Anson Cheung & Josh Stennett
     */
    $scope.setHistoryChart = function(zoneNumber, graphType, bindDivName){
      console.log("setHistoryChart received bindDivName as: " + bindDivName);
        google.load("visualization", "1", {packages:["annotationchart"]});
        //google.setOnLoadCallback(drawChart);
        var data = new google.visualization.DataTable();
        data.addColumn('date', 'Date');

        if(graphType==='light'){
            data.addColumn('number','Light (lm)');
        }else{
            data.addColumn('number', 'Temperature (℃)');
        }

        // Get a reference to our logs
        var ref = new Firebase("https://sunsspot.firebaseio.com/zone" + zoneNumber + "hourly");

        // Retrieve new logs as they are added to our database
        ref.on("child_added", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();

            if(graphType==='light'){
                data.addRow([new Date(newLog.timestamp),newLog.light]);
            }else{
                data.addRow([new Date(newLog.timestamp),newLog.temp]);
            }

            //google.setOnLoadCallback(drawChart);

            drawChart(bindDivName);
        });

        var ref2 = new Firebase("https://sunsspot.firebaseio.com/zone" + zoneNumber);
        ref2.limitToLast(180).once("value", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();
            for (var log in newLog){
                if(graphType==='light'){
                    data.addRow([new Date(newLog[log].timestamp),newLog[log].light]);
                }else{
                    data.addRow([new Date(newLog[log].timestamp),newLog[log].temp]);
                }
            }


            drawChart(bindDivName);
        });

        function drawChart(bindDivName) {
                  console.log("drawing chart to : " + bindDivName);
                  console.log($("#"+bindDivName)[0]);
                  console.log(document.getElementById(bindDivName));
          var chart = new google.visualization.AnnotationChart($("#"+bindDivName)[0]);

          var options = {
            displayAnnotations: true,
            zoomButtons:{
                  '1m': { 'label': '1m', 'offset': [0, 1, 0] },
                  '15m': { 'label': '15m', 'offset': [0, 15, 0] },
                  '1h': { 'label': '1h', 'offset': [1, 0, 0] },
                  '6hs': { 'label': '6h', 'offset': [6, 0, 0] },
                  '1d': { 'label': '1d', 'offset': [1, 0, 0, 0, 0]},
                  '5d': { 'label': '5d', 'offset': [5, 0, 0, 0, 0] },
                  '1w': { 'label': '1w', 'offset': [7, 0, 0, 0, 0] },
            },
            zoomButtonsOrder: ['1m', '15m', '1h', '6h', '1d', '5d', '1w', 'max'],
          };

          options.colors = graphType=='light' ? ['#0D47A1', '#0D47A1', '#0D47A1'] : ['#880E4F', '#AD1457', '#C2185B'];

          chart.draw(data, options);
        }
    }

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Anson Cheung & Josh Stennett
   */
  $scope.init = function() {

    //Bind graphs to zone(zoneNumber)light/temp.
    //  $scope.setHistoryChart(i, 'light', 'zone1light');

  /*  for(i=1;i<=3;i++){
        $scope.setHistoryChart(i, 'light', 'zone' + i + 'light');
        $scope.setHistoryChart(i, 'temp', 'zone' + i + 'temp');


    }*/

    function createSensor(snapshot, pageElement){
      console.log("Creating new sensor!");
      console.log(snapshot);


      //all of this applies to both person sensors && non-person sensors

      $(pageElement).find("#spotName")[0].innerHTML = snapshot.name; //insert the spot name
      $(pageElement).find("#spotMAC")[0].innerHTML = snapshot.address; //insert the spot name

      if(snapshot.task != "person"){ //new sensor is not a person sensor
        var spotTask = $(pageElement).find("#spotTask")[0];
        setTask(spotTask, snapshot.task); //set the task

        if(snapshot.task == "idle"){ //set the status light to red if the sensor is idle.
          var status = $(pageElement).find("#status");
          $(status).css('background-color','darkred');
        }

        var editButton = $(pageElement).find("#editSensorBtn")[0]; //set up the links as seen in child_changed listener
        $(editButton).data('name', snapshot.name);
        $(editButton).data('task', snapshot.task);
        $(editButton).data('address', snapshot.address);
        $(editButton).data('zone', snapshot.zone);
        //???????????????????????????????????????????????????????????????
        var historySensorBtn = $(pageElement).find("#historySensorBtn")[0]; //set up the links as seen in child_changed listener
        $(historySensorBtn).data('address', snapshot.address);
        //???????????????????????????????????????????????????????????????


        appendSensor("Sensors",snapshot.zone,pageElement);

      }else{ //new sensor is a person sensor

        var viewButton = $(pageElement).find("#viewPersonBtn")[0]; //set up the links as seen in child_changed listener
        $(viewButton).data('name', snapshot.name);
        $(viewButton).data('task', snapshot.task);
        $(viewButton).data('address', snapshot.address);
        $(viewButton).data('zone', snapshot.zone);


        appendSensor("people",snapshot.zone,pageElement);

      }

      $(pageElement).removeClass('hidden'); //element created, so display it.
    }

    function setTask(element, task){
      if(task == 'sl'){
        element.innerHTML = 'Light sensor';
      }else if(task == "sm"){
        element.innerHTML = 'Motion sensor';
      }else if(task == "st"){
        element.innerHTML = 'Temperature sensor';
      }else if(task == "zone"){
        element.innerHTML = 'Zone sensor';
      }else if(task == "idle"){
        element.innerHTML = 'Idle sensor';
      }else{
        element.innerHTML = 'Unknown Type';
      }

    }

    function updatePersonSensor(snapshot, changedElement){
      $(changedElement).find("#spotName")[0].innerHTML = snapshot.name;

      $(changedElement).find("#spotMAC")[0].innerHTML = snapshot.address;

      var link = $(changedElement).find("#viewPersonBtn")[0]; //find the link to Edit modal

      var oldZone = $(link).data('zone'); //get the old task from the data attribute on the link
      var oldTask = $(link).data('task');

      $(link).data('name', snapshot.name); //update the data attributes to the new data
      $(link).data('task', snapshot.task);
      $(link).data('zone', snapshot.zone);

      if(oldTask != snapshot.task){

        dataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings" + changedSensor.address);
        dataRef.remove()
      }

      if (oldZone != snapshot.zone) { //if the zone has changed, the element needs to move to a different sub-heading

        appendSensor("people",snapshot.zone,changedElement);

      }
    }

    function updateSensor(snapshot, changedElement){
      $(changedElement).find("#spotName")[0].innerHTML = snapshot.name; //populate element name

      var spotTask = $(changedElement).find("#spotTask")[0];
      setTask(spotTask, snapshot.task); //set the task

      var status = $(changedElement).find("#status")[0]
      $(status).css('background-color','green');

      if(snapshot.task == 'idle'){
        $(status).css('background-color','darkred');
      }

      var link = $(changedElement).find("#editSensorBtn")[0]; //find the link to Edit modal

      var oldZone = $(link).data('zone'); //get the old task from the data attribute on the link
      var oldTask = $(link).data('task');

      $(link).data('name', snapshot.name); //update the data attributes to the new data
      $(link).data('task', snapshot.task);
      $(link).data('zone', snapshot.zone);

      if(oldTask != snapshot.task){
        dataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address);
        dataRef.remove()
      }

      if (oldZone != snapshot.zone) { //if the task has changed, the element needs to move to a different sub-heading
        appendSensor("Sensors",snapshot.zone,changedElement);
      }
    }

    function appendSensor(location, zone, element){
      if(zone == 1 || zone == 2 || zone == 3){
        $("#zone"+zone+location).append(element)
      }else{
        $("#zoneContainer").append(element)
      }

    }
    var settingsRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings");

    settingsRef.on("child_added", function(snapshot) { //listen for when a child is added : also triggers once for each child in database on page load.
          //console.log(snapshot.key());

        newSensor = snapshot.val();

        if(newSensor.task != 'person'){ //sensor is not a person tracker

          newSensor.address = snapshot.key();

          var sensorElement = $("#sensorTemplate").clone(); //create an instance of the template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces

          createSensor(newSensor, sensorElement);


        }else{ //sensor is a person tracker

          newSensor.address = snapshot.key();

          var personElement = $("#personTemplate").clone();
          $(personElement).attr('id', newSensor.address.replace(/ /g, "_"));

            createSensor(newSensor, personElement);
        }


    });

    settingsRef.on("child_changed", function(snapshot) { //listen for when a child is edited
        console.log('child changed');

        var changedSensor = snapshot.val();
        changedSensor.address = snapshot.key();


        var changedElement = $('#' + snapshot.key().replace(/ /g, "_"))[0] //element ID's are the MAC address with underscores instead of spaces

        var link = $(changedElement).find(".data-button")[0]; //find the link to Edit modal
        var oldTask = $(link).data('task');

        var newTask = changedSensor.task;

        if(oldTask == "person" && newTask == "person"){
            //person stayed a person
          updatePersonSensor(changedSensor, changedElement);


        }
        else if(oldTask == "person" && newTask != "person"){
          console.log("Triggered");
          //person became sensor
          $(changedElement).remove(); //remove the old sensor, as it's type has changed.

          changedSensor.address = snapshot.key();

          var sensorElement = $("#sensorTemplate").clone(); //create an instance of the new template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces

          createSensor(changedSensor, sensorElement);


        }
        else if(oldTask != "person" && newTask == "person"){
          //sensor became person
                    $(changedElement).remove();
                    var personElement = $("#personTemplate").clone();
                    $(personElement).attr('id', changedSensor.address.replace(/ /g, "_"));

                    createSensor(changedSensor, personElement);

        }
        else if(oldTask != "person" && newTask != "person"){
          //sensor stayed sensor
          updateSensor(changedSensor, changedElement);

        }

    });

    $(document).on("click", "#editSensorBtn", function() { //when you open the Edit modal
        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        console.log(task);
        var address = $(this).data('address');
        var zone = $(this).data('zone');


        var modal = $("#myModal"); //get the modal element
        modal.find("#myModalLabel")[0].innerHTML = name; //insert variables to the element

        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;
        modal.find("input#" + task).prop("checked", true);
        modal.find("#sensorZone")[0].innerHTML = zone

        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;

        console.log(name);
    });

    /**
   * When #historySensorBtn is clicked, it opens a dialog and sets spotId to its <div>
   * to allow setSensorHistoryChart to plot graph on the div
   * @author Anson Cheung
   */
    $(document).on("click", "#historySensorBtn", function() {

        var address = $(this).data('address');
        var spotId = address.slice(-4);

        ngDialog.open({
            template: '<div id="' + spotId + '" class="history-chart""></div>',
            plain: true
        });

        $scope.setSensorHistoryChart(address, spotId);

    });

    $(document).on("click", "#viewPersonBtn", function() { //when you open the Edit modal
        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        var address = $(this).data('address');
        var zone = $(this).data('zone');



        var modal = $("#viewPerson");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;

        modal.find("input#" + task).prop("checked", true);
        modal.find("#personZone")[0].innerHTML = zone

        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;
    });

  }

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Josh Stennett
   */
  $scope.deleteSubmit = function() {
    console.log("in func");
      var address = document.getElementById('deleteSpotAddress').innerHTML; //read in the address
      console.log("Deleting " + address); //log the delete address just in case

      var delRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/" + address); //programatically generate the reference url

      delRef.remove(); //call the remove function to remove the data from Firebase
      $("#" + address.replace(/ /g, "_")).remove(); //remove th element from the DOM
      $('.modal').modal('hide');
  };

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Josh Stennett
   */
  $scope.modalSubmit = function() {
      var modal = $("#myModal")
      var address = modal.find("#spotAddress")[0].innerHTML //populate variables based off of form values

      var newName = modal.find("#name")[0].value;

      var newTask = modal.find('input[name="optradio"]:checked').val();

      var newZone = parseInt($("span#sensorZone")[0].innerHTML);

      console.log("new zone: " + newZone);
      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone
      }); //update the record with the new data
  };

  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Josh Stennett
   */
  $scope.personSubmit = function() {

    var modal = $("#viewPerson")
    var address = modal.find("#spotAddress")[0].innerHTML //populate variables based off of form values

    var newName = modal.find("#name")[0].value;

    var newTask = modal.find('input[name="optradio"]:checked').val();

    var newZone = parseInt($("span#personZone")[0].innerHTML);
    console.log("new zone: " + newZone);

      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone
      }); //update the record with the new data
  };


    /**
   * Pop up light & temp history graphs for the 3 zones.
   * Developer note: It uses ngDialog directive
   * @param {String} zoneHistory - For example zone 1 light would be 'zone1light', zone 2 temp 'zone2temp' etc.
   * @author Anson Cheung
   */
    $scope.openHistory = function(zoneHistory){
        ngDialog.open({
            template: '<div google-chart chart="' + zoneHistory + '" class="history-chart"></div>',
            plain: true
        });
    };

    /**
     * Generate a annotation graph and set it to a <div>
     * @param {String} address - Either 'light' or 'temp'.
     * @param {String} spotId - The last 4 letters of the spot's ID. Example: '76D3', '797D'.
     * @author Anson Cheung
     */
    $scope.setSensorHistoryChart = function(address, spotId){

        var address = address.replace(/\s+/g, '%20'); //Replace spaces with %20%
        var spotRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + address);

        google.load("visualization", "1", {packages:["annotationchart"]});
        //google.setOnLoadCallback(drawChart);

        var data = new google.visualization.DataTable();

        data.addColumn('date', 'Date');
        data.addColumn('number','Value');

        spotRef.once("value", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();
            for (var log in newLog){
                data.addRow([new Date(newLog[log].timestamp),newLog[log].newVal]);
            }

            drawChart(data, spotId, ['#004D40', '#00695C', '#00796B']);
        });
    }

    /**
     * Draw Chart to <div> with the given data
     * @param {data} data - Google chart object
     * @param {String} bindDivName - <div> name you want to bind your graph to
     * @param {colors}
     * @author Anson Cheung
     */
    function drawChart(data, bindDivName, colors) {

          var chart = new google.visualization.AnnotationChart(document.getElementById(bindDivName));

          var options = {
            displayAnnotations: true,
            zoomButtons:{
                  '1m': { 'label': '1m', 'offset': [0, 1, 0] },
                  '15m': { 'label': '15m', 'offset': [0, 15, 0] },
                  '1h': { 'label': '1h', 'offset': [1, 0, 0] },
                  '6hs': { 'label': '6h', 'offset': [6, 0, 0] },
                  '1d': { 'label': '1d', 'offset': [1, 0, 0, 0, 0]},
                  '5d': { 'label': '5d', 'offset': [5, 0, 0, 0, 0] },
                  '1w': { 'label': '1w', 'offset': [7, 0, 0, 0, 0] },
            },
            zoomButtonsOrder: ['1m', '15m', '1h', '6h', '1d', '5d', '1w', 'max'],
          };

          options.colors = colors;

          chart.draw(data, options);
        }

    $scope.init();
}]);




//Map Controller
spotApp.controller('mapController', ['$scope','$firebaseObject',
function($scope, $firebaseObject) {

    $scope.ref = [];
    $scope.syncObject = [];
    $scope.sensors = [];

    $scope.i = 0;

    // Retrieve new sensors as they are added to our database
    spotSettingsRef.on("child_added", function(snapshot) {
        var key = snapshot.key().replace(/\s+/g, '%20');

        $scope.ref[$scope.i] = new Firebase("https://sunsspot.firebaseio.com/spotSettings/" + key);

        var localObject = $scope.syncObject[$scope.i];

        // download the data into a local object
        localObject = $firebaseObject($scope.ref[$scope.i]);

        // synchronize the object with a three-way data binding
        localObject.$bindTo($scope, "sensor_" + $scope.i);

        $scope.sensors[$scope.i] = localObject;

        $scope.i++;
    });

    //Generate Grid Table
    $scope.data = [];
    $scope.x = 7.69; // height of a sqaure in %
    $scope.y = 3.025; // Width of a square in %

    $scope.zone1 = "zone1";
    $scope.zone2 = "zone2";
    $scope.zone3 = "zone3";

    for(i=0;i<13;i++)
        for(y=0;y<33;y++)
            $scope.data.push({x: i, y: y});

}]);

//Map - Box directive
spotApp.directive('box', function(){

    return {
        restrict: 'E',
        scope: {
            data: '=',
            x: '=',
            y: '=',
            zone: '=',
        },
        template: '<div class="box {{zone}} box-{{x}}-{{y}}" style="top:{{x}}%;left:{{y}}%"></div>',
        controller: function($scope){
            // console.log($scope.data);
        }
    };
});

// Map - Sensor directive
spotApp.directive('sensor', function(){
    return{
        restrict:'E',
        scope:{
            zone : '=',
            task : '=',
            name : '=',
            x: '=',
            y: '='
        },
        template: '<div class="sensor" style="top:{{x}}%;left:{{y}}%"><img style="width:100%;" src="images/{{task}}.png" ><p>{{name}}</p></div>'
    };
});
