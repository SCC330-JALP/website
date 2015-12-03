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
var spotApp = angular.module('spotApp', ['ngRoute', 'ngResource', 'firebase', 'googlechart', 'ngDialog', 'ngDraggable', 'n3-line-chart', 'ngAnimate', 'ui.bootstrap', 'rzModule']);
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

    $rootScope.zone1Data = $firebaseObject(ref.child('zone1'));
    $rootScope.zone2Data = $firebaseObject(ref.child('zone2'));
    $rootScope.zone3Data = $firebaseObject(ref.child('zone3'));

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
                max: 100,
                width: 400,
                height: 120,
                yellowFrom: 50,
                yellowTo: 75,
                redFrom: 75,
                redTo: 100,
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
       * Listens to live changes of firebase objects
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
                    ['Light', light]
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
       * Puse data into firebase
       * @param {String} childName - The name of the child name.
       * @param {Object} object - The object that you want to push data to.
       * @param {String} type - The type of the sensor.
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

    /**
       * Puse data into firebase
       * @param {String} childName - The name of the child name.
       * @param {Object} object - The object that you want to push data to.
       * @param {String} type - The type of the sensor.
       * @author Anson Cheung
       */
    $rootScope.pushHRData = function(childName, object, type) {
        ref.child(childName).limitToLast(180).on("value", function(snapshot) {
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
        $rootScope.pushHRData('zone' + (i + 1), zoneLight[i], 'light');

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

  $rootScope.dataTest = [
      {x: 0, value: 4, otherValue: 14},
      {x: 1, value: 8, otherValue: 1},
      {x: 2, value: 15, otherValue: 11},
      {x: 3, value: 16, otherValue: 147},
      {x: 4, value: 23, otherValue: 87},
      {x: 5, value: 42, otherValue: 45}
    ];

    $rootScope.optionsTest = {
      axes: {
        x: {key: 'x', ticksFormat: '.2f', type: 'linear', min: 0, max: 10, ticks: 2},
        y: {type: 'linear', min: 0, max: 1, ticks: 5, innerTicks: true, grid: true},
        y2: {type: 'linear', min: 0, max: 1, ticks: [1, 2, 3, 4]}
      },
      margin: {
        left: 100
      },
      series: [
        {y: 'value', color: 'steelblue', thickness: '2px', type: 'area', striped: true, label: 'Pouet'},
        {y: 'otherValue', axis: 'y2', color: 'lightsteelblue', visible: false, drawDots: true, dotSize: 2}
      ],
      lineMode: 'linear',
      tension: 0.7,
      tooltip: {mode: 'scrubber', formatter: function(x, y, series) {return 'pouet';}},
      drawLegend: true,
      drawDots: true,
      hideOverflow: false,
      columnsHGap: 5
    }

})

//smart lab Controller
spotApp.controller('smartlabController', ['$rootScope', '$scope', '$interval', '$timeout', '$firebaseObject', '$parse', 'ngDialog', '$uibModal',
function($rootScope, $scope, $interval, $timeout, $firebaseObject, $parse, ngDialog, $uibModal) {




  $scope.open = function(zoneNumber, type){

    var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled | true,
      templateUrl: 'zoneHistory.html',
      controller: 'zoneHistoryCtrl',
      size: 'lg',
      resolve: {
        zoneHistory: function (){
            if(type == 'light'){
                if(zoneNumber==1)
                    return $rootScope.zone1light;
                if(zoneNumber==2)
                    return $rootScope.zone2light;
                if(zoneNumber==3)
                    return $rootScope.zone3light;
            }
            if(type == 'temp'){
                if(zoneNumber==1)
                    return $rootScope.zone1temp;
                if(zoneNumber==2)
                    return $rootScope.zone2temp;
                if(zoneNumber==3)
                    return $rootScope.zone3temp;
            }

        },
        zoneReference: function(){
            // if(zoneNumber==1)
            //     return $rootScope.zone1Data;
            // if(zoneNumber==2)
            //     return $rootScope.zone2Data;
            // if(zoneNumber==3)
            //     return $rootScope.zone3Data;
            if(zoneNumber==1)
                return ref.child('zone1');
            if(zoneNumber==2)
                return ref.child('zone2');
            if(zoneNumber==3)
                return ref.child('zone3');
        },
        zoneNumber: function(){
            return zoneNumber;
        },
        type: function(){
            return type;
        }
      },
    });

    modalInstance.result.then(function (selectedItem) {
      // $scope.selected = selectedItem;
    }, function () {
            console.log('Modal dismissed at: ' + new Date());
        });
    };

    $scope.toggleAnimation = function () {
        $scope.animationsEnabled = !$scope.animationsEnabled;
    };


    /*Available range options*/
    $scope.playbackHours = [
        {code : 1, hour: '1 hour'},
        {code : 5, hour: '5 hours'},
        {code : 24, hour: '24 hours'} ,
        {code : 168, hour: '1 week'}
    ];

    /*Default selected range*/
    $scope.selected = $scope.playbackHours[0];

    /*Available speed options*/
    $scope.playbackSpeed = [
        {code : 1, speed: '1x'},
        {code : 2, speed: '5x'},
        {code : 5, speed: '20x'} ,
        {code : 10, speed: '100x'}
    ];

    /*Default speed options*/
    $scope.selectedSpeed = $scope.playbackSpeed[0];

    /**
     * Load and synchronize history from firebase to local object
     * @constructor
     * @author Anson Cheung
     */
    $scope.loadHistory = function(){

        //Retrieve opened sensor values
        var spotAddress = $('#historyPlayback').find('#spotAddress')[0].innerHTML
        var hours =  $scope.selected.code;
        var hoursMilli = hours * 3600000;
        var curDate = new Date();
        curDate = Date.now();

        $scope.speed = $scope.selectedSpeed.code;
        $scope.index = 0;

        // Get a reference for our log
        var ref = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + spotAddress + "/zone");

        $scope.ref = [];
        $scope.history = [];

        var j = 0;

        ref.on('child_added', function(snapshot, prevChildKey) {
            var data = snapshot.val();

            //Set range of selected data
            if(data.timestamp >= (curDate - hoursMilli)){
                $scope.ref[j] = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + spotAddress + "/zone/" + snapshot.key());
                $scope.history[j] = $firebaseObject($scope.ref[j]);
                j++;
            }

        });
    }

    /**
     * Playback history - It increases its index every 1 second d ivided by the choose speed
     * The interface function is being called and stored inside a promise variable to be closed later on.
     * @param {int} length - The length of the history records.
     * @author Anson Cheung
     */
    var promise;
    $scope.play = function(length){
        console.log("play buttion pressed.");

        promise = $interval(function(){
                        if($scope.index < length){
                            $scope.index++;
                        }else{
                            $scope.stop();
                        }
                    }, 1000 / $scope.speed);

    }

    /**
     * Stop/Pause history playing - Close the promise that was initialized by play function
     * @param {int} length - The length of the history records.
     * @author Anson Cheung
     */
    $scope.stop = function(){
        $interval.cancel(promise);
        promise = $timeout(function(){
            console.log("Stopped.");
        }, 1000);
    }

    /**
     * Change the speed/FPS for the animation
     * It first change the speed, then stop the player, and finally play it again.
     * @param {int} length - The length of the history records.
     * @author Anson Cheung
     */
    $scope.changeSpeed = function(length){
        $scope.speed = $scope.selectedSpeed.code;
        console.log("FPS: " + $scope.speed);
        $scope.stop();
        $scope.play(length);
    }

    /**
     * It increases its index by 1 so user can manually forward the animation
     * @param {int} length - The length of the history records.
     * @author Anson Cheung
     */
    $scope.forward = function(length){
        if($scope.index < length){
            $scope.index++;
            console.log($scope.history[$scope.index]);
        }
    }

    /**
     * It decreases its index by 1 so user can manually backward the animation
     * @param {int} length - The length of the history records.
     * @author Anson Cheung
     */
    $scope.backward = function(length){
        if($scope.index > 0 && $scope.index <= length){
            $scope.index--;
            console.log($scope.history[$scope.index]);
        }
    }

    /**
     * It restarts its index back to 0 so the animation will start from the beginning.
     * @author Anson Cheung
     */
    $scope.restart = function(){
        $scope.index = 0;
    }

    /**
     * It clears everything when the player is closed.
     * @author Anson Cheung
     */
    $scope.clear = function(){
        console.log("Clearing...");
        $scope.index = 0;
        $scope.ref = [];
        $scope.history = [];
        $scope.selected = $scope.playbackHours[0];
        $scope.selectedSpeed = $scope.playbackSpeed[0];
    }

    /**
     * It allows user to change the index of the history.
     * @param {index} - The index number you want to set.
     * @author Anson Cheung
     */
    $scope.setIndex = function(index){
        // console.log($scope.index);
        $scope.index = index;
    }

    /**
     * Return an array of a desired range of numbers.
     * @param {int} num - The length of an array.
     * @return {Array(num)} - Return an array of numbers.
     * @author Anson Cheung
     */
    $scope.range = function(num) {
        return new Array(num);
    }

    $scope.console = function(input){
        console.log(input);
    }

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
        // google.load("visualization", "1", {packages:["annotationchart"]});
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


    $("#colourSlider").slider({
      min: -128,
      max: 127
    })

    $("#brightnessSlider").slider({
      min: 0,
      max: 59
    })


    //Bind graphs to zone(zoneNumber)light/temp.
     // $scope.setHistoryChart(i, 'light', 'zone1light');

  /*  for(i=1;i<=3;i++){
        $scope.setHistoryChart(i, 'light', 'zone' + i + 'light');
        $scope.setHistoryChart(i, 'temp', 'zone' + i + 'temp');


    }*/

    /**
     * Generate a sparkline and set it to a <div>
     * @constructor
     * @param {int} zoneNumber - Zone number.
     * @param {String} sensorType - Name of the sensor Type.
     * @return {sparkline Object} - This returns the line chart object and you can call it in HTML
     * HTML: <div google-chart chart="sparkline(int ZoneNumber, String sensorType)" style="height:50px;cursor:pointer;"></div>
     * @author Anson Cheung & Josh Stennett
     */
    $scope.sparkline = function(zoneNumber, sensorType, color){
        var zoneRef = new Firebase("https://sunsspot.firebaseio.com/zone" + zoneNumber);

        var sparkline = {};
        sparkline.type = "LineChart";


        sparkline.data = {
            "cols": [
                {id: "number",label: "number", type: "date"},
                {id: "value-data",label: "Value", type: "number"
            }],
            "rows": []
        };


        zoneRef.limitToLast(30).on('child_added', function(snapshot) {
            var data = snapshot.val();
            var timestamp = new Date(data.timestamp);

            switch(sensorType){
                case 'light':
                    sparkline.data.rows.push({c: [{v: new Date(timestamp)}, {v: data.light}]});
                    break;
                case 'temp':
                    sparkline.data.rows.push({c: [{v: new Date(timestamp)}, {v: data.temp}, ]});
                    break;
                default:
                    sparkline.data.rows.push({c: [{v: new Date(timestamp)}, {v: data.light}]});
            }

        });

        sparkline.options = {
            hAxis: {
              textPosition: 'none'
            },
            vAxis: {
              textPosition: 'none'
            },
            legend: {position: 'none'},
            lineWidth: 1,
            lineHeight: 1,
            enableInteractivity: false
        };

        switch(color){
            case 'blue':
                sparkline.options.colors = ['#0D47A1', '#0D47A1', '#0D47A1'];
                break;
            case 'red':
                sparkline.options.colors = ['#880E4F', '#AD1457', '#C2185B'];
                break;
            default:
                sparkline.options.colors = ['#000', '#000', '#000'];
        }

        return sparkline;
    }


    /**
     * DESCRIPTION
     * @author Josh Stennett, Liam cottier
     */
      $scope.fillArray = function(){
        var spotAddress = $('#historyPlayback').find('#spotAddress')[0].innerHTML
        var hours =  $('#playbackHours').val()
        var speed = $('#playbackSpeed').val()
          console.log("spotAddress " + spotAddress);
          console.log("hours " + hours);
          console.log("speed " + speed);
          var ref = new Firebase("https://sunsspot.firebaseio.com/spotReadings/"+spotAddress+"/zone");
          var zoneArray = new Array();
          var hoursMilli = hours * 3600000;
          console.log(hoursMilli);
          var curDate = new Date();
          curDate = Date.now();

          // dataTable code
          var data = new google.visualization.DataTable();
          data.addColumn('string', 'Zone');
          data.addColumn('datetime', "Time entered zone");
          data.addColumn('datetime', "Time exit zone");

          ref.on("value", function(snapshot, prevChildKey) {
            var newLog = snapshot.val();
            var oldLog = null;
            for (var log in newLog){
              if (oldLog != null){
                if(newLog[log].timestamp >= (curDate - hoursMilli)){
                    data.addRow([newLog[oldLog].newVal.toString(), new Date(newLog[oldLog].timestamp), new Date(newLog[log].timestamp)])
                }
              }


              oldLog = log;
            }
            var timeline = new google.visualization.Timeline(document.getElementById('timeline_div'));

            timeline.draw(data, {width: '100%', height: '100%'});

            var table = new google.visualization.Table(document.getElementById('table_div'));

            table.draw(data, {width: '100%', height: '100%'});
          });

        }

        /**
         * DESCRIPTION
         * @author  Liam cottier
         */
        $scope.playback = function(zoneArray,speed){
          console.log(zoneArray.length);
          for(i = 0; i<zoneArray.length;i++){
          //  var waitTime = (zoneArray[(i+1)].timestamp -zoneArray[i].timestamp)/speed
            //console.log("logging : " + zoneArray[i].newVal + " to: " + "#playbackZone"+zoneArray[i].newVal + " at array index: " + i);
            $scope.pause(10);

            $("#playbackZone"+zoneArray[i].newVal).append(zoneArray[i].newVal);
            console.log("appended");
          }
        }
        /**
         * DESCRIPTION
         * @author  Liam cottier
         */
        $scope.pause = function(millis)
        {
          var date = new Date();
          var curDate = null;

          do { curDate = new Date(); }
          while(curDate-date < millis);
        }

        /**
         * DESCRIPTION
         * @author Josh Stennett
         */
          //TWITTER WIDGET
    !function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src=p+"://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");

    function createSensor(snapshot, pageElement){

      //all of this applies to both person sensors && non-person sensors

      $(pageElement).find("#spotName")[0].innerHTML = snapshot.name; //insert the spot name
      $(pageElement).find("#spotMAC")[0].innerHTML = snapshot.address; //insert the spot name
      $(pageElement).find("#locationHistoryBtn").data('address', snapshot.address);

      var alarmButton = $(pageElement).find("#spotAlarmsBtn")[0];
      $(alarmButton).data('address', snapshot.address);
      $(alarmButton).data('name', snapshot.name);

      var batteryElement =  $(pageElement).find("#battery")[0]
      setBattery(batteryElement, parseInt(snapshot.battery));

      if(!snapshot.alive){ //set the status light to red if the sensor is not alive.
        var status = $(pageElement).find("#status");
        $(status).css('background-color','darkred');
      }

      if(snapshot.task.indexOf("p") === -1){ //new sensor is not a person sensor
        //console.log("Creating new sensor!");
        //console.log(snapshot);
        var spotTask = $(pageElement).find("#spotTask")[0];
        setTask(spotTask, snapshot.task); //set the task


        if(snapshot.task == "sc"){
            var editButton = $(pageElement).find("#editCupBtn")[0]; //set up the links as seen in child_changed listener
        }else if(snapshot.task =="sv" || snapshot.task =="si" || snapshot.task =="sd"){
            var editButton = $(pageElement).find("#editBespokeBtn")[0]; //set up the links as seen in child_changed listener
        }else{
            var editButton = $(pageElement).find("#editSensorBtn")[0]; //set up the links as seen in child_changed listener

        }

        $(editButton).data('name', snapshot.name);
        $(editButton).data('task', snapshot.task);
        $(editButton).data('address', snapshot.address);
        $(editButton).data('zone', snapshot.zone);
        $(editButton).data('status', snapshot.alive);
        $(editButton).data('battery', snapshot.battery);

        var historySensorBtn = $(pageElement).find("#historySensorBtn")[0]; //set up the links as seen in child_changed listener
        $(historySensorBtn).data('address', snapshot.address);
        $(historySensorBtn).data('task', snapshot.task);



        appendSensor(snapshot.zone,pageElement);

      }else{ //new sensor is a person sensor
        //console.log("Creating new person!");
      //  console.log(snapshot);

        var viewButton = $(pageElement).find("#viewPersonBtn")[0]; //set up the links as seen in child_changed listener
        $(viewButton).data('name', snapshot.name);
        $(viewButton).data('task', snapshot.task);
        $(viewButton).data('address', snapshot.address);
        $(viewButton).data('zone', snapshot.zone);
        $(viewButton).data('status', snapshot.alive);
        $(viewButton).data('battery', snapshot.battery);

        var profileRef = new Firebase("https://sunsspot.firebaseio.com/spotProfile/"+snapshot.address+"/FileName");

        profileRef.once("value", function(snapshot){
          var fileName = snapshot.val();
          //console.log(snapshot);
          if(fileName != "undefined.jpg"){
            var img = document.createElement("img");
            img.src = "../images/profile/" + fileName;
            img.width = 100;
            img.height = 100;
            $(pageElement).find("#profileImage").empty().append(img).removeClass("fa fa-user fa-4x");
          }

        });

        appendSensor(snapshot.zone,pageElement);

      }
      if(snapshot.task != "sp" ){
        createDataListeners(snapshot, pageElement);
      }
      $(pageElement).removeClass('hidden'); //element created, so display it.
    }

    function setBattery(element, battery){
      $(element).removeAttr('style');
      $(element).removeClass();
      $(element).addClass('pull-left');
      if(battery < 6){
        $(element).addClass('fa fa-battery-0');
        $(element).css('color','red');
      }else if(battery < 21){
        $(element).addClass('fa fa-battery-0');
      }else if(battery < 41){
        $(element).addClass('fa fa-battery-1');
      }else if(battery < 61){
        $(element).addClass('fa fa-battery-2');
      }else if(battery < 81){
        $(element).addClass('fa fa-battery-3');
      }else{
        $(element).addClass('fa fa-battery-4');
      }
    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function setTask(element, task){
      taskLength = task.length; //get the length of the task string
     if(task == "s"){ //if the task is just "s" it must be idle
        element.innerHTML = "Idle Sensor";
      }else if(task == "zone"){ //if the task is just "zone", then it's a static zone sensor
          element.innerHTML = "Zone sensor";
      }else if(task == "sc"){
        element.innerHTML = "";
      }else if(task == "sv"){
        element.innerHTML = "Volume sensor";
      }else if(task == "si"){
        element.innerHTML = "Infrared sensor";
      }else if(task == "sd"){
        element.innerHTML = "Door sensor";
      }else{
          var elementString = ""; //initialise a string
          var appendCommas = false;
          for(var i = 0; i < taskLength; i++){ //loop through every letter

          var char = task.charAt(i); //get the current character
          if(char == "m"){ //if current char is m
            elementString = elementString + "Motion"; //append motion to the string
          }else if(char == "l"){
            elementString = elementString + "Light"; // .. etc..
          }else if(char == "t"){
            elementString = elementString + "Temperature";
          }else if(char == "b"){
            elementString = elementString + "Button";
          }else if(char == "s"){
            //ignore it as we handle it above (but still need to identify it here)
          }else{
            elementString = elementString + "Unknown: " + char; //if an unknown character is found, output the char as unknown
            console.log("Unkown char in task: " + task); //also log the task that contained the unkown char
          }
          if(i == taskLength-1){  //if we're at the last character in the string
            appendCommas = false; //dont append a comma
            elementString = elementString + " "; //but do append a speace
          }
          if(appendCommas){
            elementString = elementString + ", "; //if we're not at the start, append commas in between sensor types
          }
          appendCommas = true; //enable commas

        }
        element.innerHTML = elementString + "Sensor"; //once the string has been  built, append sensor and then insert it to the DOM
      }

    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function updatePersonSensor(snapshot, changedElement){
      $(changedElement).find("#spotName")[0].innerHTML = snapshot.name;

      $(changedElement).find("#spotMAC")[0].innerHTML = snapshot.address;
      var batteryElement =  $(changedElement).find("#battery")[0]
      setBattery(batteryElement, parseInt(snapshot.battery));
      var status = $(changedElement).find("#status")[0]
      $(status).css('background-color','green');

      if(!snapshot.alive ){
        $(status).css('background-color','darkred');

      }

      var link = $(changedElement).find("#viewPersonBtn")[0]; //find the link to Edit modal

      var oldZone = $(link).data('zone'); //get the old task from the data attribute on the link
      var oldTask = $(link).data('task');

      $(link).data('name', snapshot.name); //update the data attributes to the new data
      $(link).data('task', snapshot.task);
      $(link).data('zone', snapshot.zone);
      $(link).data('status', snapshot.alive);
      $(link).data('battery', snapshot.battery);



      if (oldZone != snapshot.zone) { //if the zone has changed, the element needs to move to a different sub-heading
        appendSensor(snapshot.zone,changedElement);
      }

      var profileRef = new Firebase("https://sunsspot.firebaseio.com/spotProfile/"+snapshot.address+"/FileName");

      profileRef.once("value", function(snapshot){
        var fileName = snapshot.val();
        //console.log(snapshot);
        if(fileName != "undefined.jpg"){
          var img = document.createElement("img");
          img.src = "../images/profile/" + fileName;
          img.width = 100;
          img.height = 100;
          $(changedElement).find("#profileImage").empty().append(img).removeClass("fa fa-user fa-4x");
        }

      });



    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function updateSensor(snapshot, changedElement){
      $(changedElement).find("#spotName")[0].innerHTML = snapshot.name; //populate element name
      var batteryElement =  $(changedElement).find("#battery")[0]
      setBattery(batteryElement, parseInt(snapshot.battery));
      var spotTask = $(changedElement).find("#spotTask")[0];
      setTask(spotTask, snapshot.task); //set the task

      var status = $(changedElement).find("#status")[0]
      $(status).css('background-color','green');

      if(!snapshot.alive ){
        $(status).css('background-color','darkred');

      }

      if(snapshot.task == "sv" || snapshot.task =="sd" || snapshot.task == "si"){
        var link = $(changedElement).find("#editBespokeBtn")[0]; //find the link to Edit modal
      }else{
        var link = $(changedElement).find("#editSensorBtn")[0]; //find the link to Edit modal
      }

      var oldZone = $(link).data('zone'); //get the old task from the data attribute on the link
      var oldTask = $(link).data('task');

      $(link).data('name', snapshot.name); //update the data attributes to the new data
      $(link).data('task', snapshot.task);
      $(link).data('zone', snapshot.zone);
      $(link).data('status', snapshot.alive);
      $(link).data('battery', snapshot.battery);

      //console.log("Old Task : " + oldTask + " | New Task : "+ snapshot.task);


      if (oldZone != snapshot.zone) { //if the task has changed, the element needs to move to a different sub-heading
        appendSensor(snapshot.zone,changedElement);
      }
    }



    function updateCup(snapshot, changedElement){
      $(changedElement).find("#spotName")[0].innerHTML = snapshot.name; //populate element name
      var batteryElement =  $(changedElement).find("#battery")[0]
      setBattery(batteryElement, parseInt(snapshot.battery));
      var spotTask = $(changedElement).find("#spotTask")[0];
      setTask(spotTask, snapshot.task); //set the task

      var status = $(changedElement).find("#status")[0]
      $(status).css('background-color','green');

      if(!snapshot.alive ){
        $(status).css('background-color','darkred');

      }

      var link = $(changedElement).find("#editCupBtn")[0]; //find the link to Edit modal

      var oldZone = $(link).data('zone'); //get the old task from the data attribute on the link
      var oldTask = $(link).data('task');

      $(link).data('name', snapshot.name); //update the data attributes to the new data
      $(link).data('task', snapshot.task);
      $(link).data('zone', snapshot.zone);
      $(link).data('status', snapshot.alive);
      $(link).data('battery', snapshot.battery);

      //console.log("Old Task : " + oldTask + " | New Task : "+ snapshot.task);


      if (oldZone != snapshot.zone) { //if the task has changed, the element needs to move to a different sub-heading
        appendSensor(snapshot.zone,changedElement);
      }
    }

    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function appendSensor(zone, element){
      if(zone == 1 || zone == 2 || zone == 3){
        try{
          $(element).draggable("destroy");
          $(element).removeAttr('style');
        }catch(err){}

        $(element).css('display', 'none');
        $("#zone"+zone+"Sensors").append(element)
        $(element).slideDown('slow');
        countChildren();

        try{
          $(element).draggable({containment: "parent"});
        }catch(err){}

      }else{
        $("#zoneContainer").append(element)
      }

    }

    function countChildren(){
      var zone1 = $("#zone1Sensors")[0];
      var zone2 = $("#zone2Sensors")[0];
      var zone3 = $("#zone3Sensors")[0];

      zone1Children = $(zone1).children().length;
      zone2Children = $(zone2).children().length;
      zone3Children = $(zone3).children().length;

      //console.log("z1:" + zone1Children + " z2:" + zone2Children + " z3:" + zone3Children);

      $("#zone1SensorCounter")[0].innerHTML = zone1Children;
      $("#zone2SensorCounter")[0].innerHTML = zone2Children;
      $("#zone3SensorCounter")[0].innerHTML = zone3Children;


    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    function createDataListeners(snapshot, element){
      //console.log("LiveData Listener created");
      var spotAddress = snapshot.address;

      if(newSensor.task.indexOf("b") !== -1){
        var btnoutput = $(element).find("#liveDatabtn")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/button")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){
          var time = new Date(snapshot.val().timestamp)
                    //btnoutput.innerHTML = "Button " + snapshot.val().newVal + " pressed at " + time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
          var buttonID = snapshot.val().newVal;

          if(buttonID == 1){
              btnoutput.innerHTML = "<i class='fa fa-sign-in fa-rotate-90 fa-2x'></i><b>" + buttonID + "</b> " + time.getHours() + ":" + time.getMinutes();
          }else if(buttonID == 2){
              btnoutput.innerHTML = "<i class='fa fa-sign-in fa-rotate-90 fa-2x'></i><b>" + buttonID + "</b> " + time.getHours() + ":" + time.getMinutes();
          }


        })
      }

      if(newSensor.task.indexOf("l") !== -1){
          var lightoutput = $(element).find("#liveDatalight")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/light")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){
          var time = new Date(snapshot.val().timestamp)

          lightoutput.innerHTML = "<i class='fa fa-lightbulb-o fa-2x'></i> " + snapshot.val().newVal + "% " + time.getHours() + ":" + time.getMinutes();

          var greyScale = ["#000000","#191919","#323232","#4c4c4c","#666666","#7f7f7f","#999999","#b2b2b2","#cccccc","#e5e5e5"];
          greyScaleIndex = snapshot.val().newVal / 10;
          if(greyScaleIndex > 10){
            greyScaleIndex = 10;
          }
          //console.log("Grey Scale Index: " + greyScaleIndex);
          //console.log(greyScale[greyScaleIndex-1]);
          $(lightoutput).find(".fa-lightbulb-o").first().css('color',greyScale[greyScaleIndex-1]);
        })
      }

      if(newSensor.task.indexOf("m") !== -1){
          var motionoutput = $(element).find("#liveDatamotion")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/motion")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){
          var time = new Date(snapshot.val().timestamp)

          motionoutput.innerHTML = "<i class='fa fa-arrows fa-2x'></i> "  + time.getHours() + ":" + time.getMinutes();
        })
      }

      if(newSensor.task.indexOf("t") !== -1){
          var tempoutput = $(element).find("#liveDatatemp")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/temp")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){
          var time = new Date(snapshot.val().timestamp)

          tempoutput.innerHTML = "<i class='fa fa-fire fa-2x'></i> " + snapshot.val().newVal.toFixed(1) + "&deg;C " + time.getHours() + ":" + time.getMinutes();

          var tempScale = ["#00FF00","#44FF00","#99FF00","#DDFF00","#FFEE00","#FFBB00","#FF8800","#FF5500","#FF2200","#FF0000"];
          //console.log(tempScale);
          tempScaleIndex = Math.round(snapshot.val().newVal / 5);
            //console.log(tempScaleIndex);
          if(tempScaleIndex > 10){
            tempScaleIndex = 10;
          }
          //console.log(tempScaleIndex);
          //console.log("Grey Scale Index: " + greyScaleIndex);
          //console.log(greyScale[greyScaleIndex-1]);
          $(tempoutput).find(".fa-fire").first().css('color',tempScale[tempScaleIndex-1]);
        })
      }

      if(newSensor.task.indexOf("c") !== -1){
          var glass = $(element).find("#glassContainer")[0];
          var water = $(element).find("#water")[0];
          var amountConsumed = $(element).find(".progress-bar")[0];
          var waterLevel = $(element).find("#waterLevel")[0];

          var amountLeftRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/cup/left")

          amountLeftRef.on("value", function(snapshot){
            var amountLeft = snapshot.val();

            waterLevel.innerHTML = Math.round(amountLeft) + "%";

            var leftPixels = (amountLeft/2)

            $(water).animate({height: leftPixels+"px"});

            })


            var dailyConsumptionRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/cup/drankToday")

        dailyConsumptionRef.on("value", function(snapshot){

          var drankToday = snapshot.val()
          var percent = (drankToday / 2000) * 100 + "%"
          $(amountConsumed).css('width', percent );
          amountConsumed.innerHTML = "<span>" + Math.round((drankToday / 2000) * 100) + "%" + "</span>";
          $(amountConsumed).find("span").css('width',percent)



        })

        var angleRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/cup/angle");

        angleRef.on("value", function(snapshot){
          var angle = snapshot.val();
          //console.log(angle);
         $(glass).css('transform', "rotate(" + angle + "deg)");

        });
      }

      if(newSensor.task == "sv"){
        var volumeOutput = $(element).find("#liveData")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/sound")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){

        volume = snapshot.val().newVal;

        if(volume == 0){
          volumeOutput.innerHTML = "<i class=' fa fa-4x fa-volume-off'>";
        }else{
          volumeOutput.innerHTML = "<i class=' fa fa-4x fa-volume-up' style='color:#8ad5f8'>";
        }

        })
      }

      if(newSensor.task == "si"){
        var irOutput = $(element).find("#liveData")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/infrared")

        newDataRef.limitToLast(1).on("child_added", function(snapshot){

        ir = snapshot.val().newVal;

        if(ir == 0){
          irOutput.innerHTML = "<i class=' fa fa-4x fa-arrows'>";
        }else{
          irOutput.innerHTML = "<i class=' fa fa-4x fa-spin fa-arrows' style='color:#8ad5f8'>";
        }

        })
      }

      if(newSensor.task == "sd"){
        var doorOutput = $(element).find("#liveData")[0]
        var newDataRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + snapshot.address + "/door")
        //console.log($(element).find(".card-content"));
        $(element).find(".card-content").prepend("<div id='doorOpen' class='col-xs-6 centered' style='color: grey;'> <b> OPEN </b> </div>  <div id='doorClosed'class='col-xs-6 centered' style='color: grey;'> <b> CLOSED </b></div>")
        //doorOutput.innerHTML = " <div id='door' style = 'width: 20px; height: 100px; background-color:brown'>"

        newDataRef.limitToLast(1).on("child_added", function(snapshot){

        doorOpen = snapshot.val().newVal;

        if(doorOpen == 1){
        //  console.log("door is open");

          $(element).find("#doorOpen").css('color','orange');
          $(element).find("#doorClosed").css('color','grey');


        /*  var doorAngleRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + spotAddress + "/doorAngle")
          doorAngleRef.on("value", function(snapshot){
            console.log(snapshot.val());
          //  $("#door").css('transform', "rotate(" + snapshot.val() -170 + "deg)");
        });*/



        }else{
        //  console.log("door is closed");
          $(element).find("#doorOpen").css('color','grey');
          $(element).find("#doorClosed").css('color','green');

        }

        })
      }
    }

    function createSensorTouchEvents(element){
      element = $(element).find(".card-content");
      //$(element).css("background-color","blue");
      var options = {};
      var hammerEvent = new Hammer(element[0], options);
      hammerEvent.get('press').set({ enable: true, threshold: 25 });
      hammerEvent.get('pinch').set({ enable: true, threshold: 0.3  });
      hammerEvent.get('rotate').set({ enable: true, threshold: 40 });


      hammerEvent.on('press', function(ev){
         //console.log("PRESS DETECTED");
         element.parent().find("#editSensorBtn")[0].click();
       })

       hammerEvent.on('pinchend', function(ev){
         if(ev.rotation >= 40 || ev.rotation <= -40){
           element.parent().find("#locationHistoryBtn")[0].click();
         } else if(ev.scale > 1){
           element.parent().find("#historySensorBtn")[0].click();
         } else if(ev.scale < 1){

           element.parent().find(".card-header")[0].click();
         }
       })

    }

    function createPersonTouchEvents(element){
      element = $(element).find(".card-content");
      //$(element).css("background-color","blue");
      var options = {};
      var hammerEvent = new Hammer(element[0], options);
      hammerEvent.get('press').set({ enable: true, threshold: 25 });
      hammerEvent.get('pinch').set({ enable: true, threshold: 0.3  });
      hammerEvent.get('rotate').set({ enable: true, threshold: 40 });


      hammerEvent.on('press', function(ev){
         //console.log("PRESS DETECTED");
         element.parent().find("#viewPersonBtn")[0].click();
       })

       hammerEvent.on('pinchend', function(ev){


         if(ev.rotation >= 40 || ev.rotation <= -40){
           element.parent().find("#locationHistoryBtn")[0].click();
         }else if(ev.scale < 1){
           element.parent().find(".card-header")[0].click();
         }
       })

    }


//  notification implementation


    faviconCounter = 0;
    var notificationList = []
    var favicon = new Favico({
      animation:'none'
    });
    var windowFocus = true;

    window.onfocus = function(){
        windowFocus = true;
        console.log("Window focussed")
        faviconCounter = 0;
        favicon.badge(0);


      if(notificationList.length){

        for(i=0;i<notificationList.length;i++){

          toastr.info(notificationList[i]);

        }

      }

      notificationList = [];

    }

    window.onblur = function(){
      windowFocus = false;
      console.log("window out of focus");
    }

    function handleNotification(message){

      if(windowFocus){
        //window focussed
        console.log("notification displayed: " + message);
        toastr.info(message);

      }else{


        //window not focussed
        faviconCounter++;

        notificationList.push(message);

        console.log(notificationList);

        favicon.badge(faviconCounter);

      }
    }



    var notificationRef = new Firebase("https://sunsspot.firebaseio.com/notification");

    notificationRef.limitToLast(1).on("child_added",function(snapshot){

      message = snapshot.val().msg;

      //console.log(message);

      handleNotification(message);
    });

    function pushNotification(message){

      notificationRef.push().set({
        msg: message
      });


    }


    var settingsRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings");
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */

    settingsRef.on("child_added", function(snapshot) { //listen for when a child is added : also triggers once for each child in database on page load.
          //console.log(snapshot.key());
          pushNotification("Child added:" + snapshot.val().name)
        newSensor = snapshot.val();
        newSensor.address = snapshot.key();
        //console.log(newSensor.task.indexOf("p"));
        if(newSensor.task === "sp"){ //sensor is person sensor

          var personElement = $("#personTemplate").clone();
          $(personElement).attr('id', newSensor.address.replace(/ /g, "_"));

            createSensor(newSensor, personElement);

            createPersonTouchEvents(personElement);

            $(personElement).draggable({containment: "parent"});



        }else if(newSensor.task == "sc"){ //sensor is cup sensor
            console.log("cup sensor");
          var cupElement = $("#cupTemplate").clone(); //create an instance of the template
          $(cupElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces
          createSensor(newSensor, cupElement);

          $(cupElement).draggable({containment: "parent"});
        }else if(newSensor.task == "sv"){

          var sensorElement = $("#bespokeTemplate").clone(); //create an instance of the template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces
          createSensor(newSensor, sensorElement);
          createSensorTouchEvents(sensorElement);
          $(sensorElement).draggable({containment: "parent"});

        }else if(newSensor.task == "si"){
          var sensorElement = $("#bespokeTemplate").clone(); //create an instance of the template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces
          createSensor(newSensor, sensorElement);
          createSensorTouchEvents(sensorElement);
          $(sensorElement).draggable({containment: "parent"});
        }else if(newSensor.task == "sd"){
          console.log("door sensor");
          var sensorElement = $("#bespokeTemplate").clone(); //create an instance of the template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces
          createSensor(newSensor, sensorElement);
          createSensorTouchEvents(sensorElement);
          $(sensorElement).draggable({containment: "parent"});
        }else{ //sensor is a multi sensor

          var sensorElement = $("#sensorTemplate").clone(); //create an instance of the template
          $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of spaces

        //  console.log(newSensor);

          createSensor(newSensor, sensorElement);

          createSensorTouchEvents(sensorElement);

          $(sensorElement).draggable({containment: "parent"});

        }


    });
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    settingsRef.on("child_changed", function(snapshot) { //listen for when a child is edited
        //console.log('child changed');
      //  console.log(snapshot.val());
        var changedSensor = snapshot.val();
        changedSensor.address = snapshot.key();


        var changedElement = $('#' + snapshot.key().replace(/ /g, "_"))[0] //element ID's are the MAC address with underscores instead of spaces


        var link = $(changedElement).find(".data-button")[0]; //find the link to Edit modal

        var oldTask = $(link).data('task');

        var newTask = changedSensor.task;

      //  console.log("newTask : " + newTask + " | oldTask : " + oldTask);

        if(oldTask == newTask){
          if(newTask == "sc"){
            updateCup(changedSensor, changedElement);
          }else if(newTask == "sp"){
            updatePersonSensor(changedSensor, changedElement);
          }else{
            updateSensor(changedSensor, changedElement);
          }
        }else{
          $(changedElement).remove(); //remove the old sensor, as it's type has changed.
          changedSensor.address = snapshot.key();
          removeDataFromTaskChange(snapshot.key());

          if(newTask == "sc"){
            var cupElement = $("#cupTemplate").clone(); //create an instance of the new template
            $(cupElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of space
            createSensor(changedSensor, cupElement);
          }else if(newTask == "sp"){
            var personElement = $("#personTemplate").clone();
            $(personElement).attr('id', changedSensor.address.replace(/ /g, "_"));
            createSensor(changedSensor, personElement);
          }else{
            var sensorElement = $("#sensorTemplate").clone(); //create an instance of the new template
            $(sensorElement).attr('id', snapshot.key().replace(/ /g, "_")); //set the id of the element to the MAC address, with underscores instead of space
            createSensor(changedSensor, sensorElement);
          }
        }

    });


    function removeDataFromTaskChange(address){
      readingsRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + address);
      readingsRef.remove()

      profileRef = new Firebase("https://sunsspot.firebaseio.com/spotProfile/" + address);
      profileRef.remove()

      alarmRef = new Firebase("https://sunsspot.firebaseio.com/spotAlarms/" + address);
      alarmRef.remove()

    }
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
  lightref = new Firebase("https://sunsspot.firebaseio.com/lamps")
     $(document).on("click", "#lightSwitch", function(){

       $(this).toggleClass('on');



       if($(this).hasClass('on')){
          //has just been turned on

          lightref.update({
            task : "off"
          })

       }else{//has just been turned off


         lightref.update({
           task : "on"
         })
       }


     })

     $("#colourSlider").on("slide", function(event, ui){
       //console.log(ui.value);


       lightref.update({
         task: "colour",
         value: ui.value
       })
     })

     $("#brightnessSlider").on("slide", function(event, ui){
       console.log(ui.value);


       lightref.update({
         task: "brightness",
         value: ui.value
       })
     })

     $("#brightnessSlider").on("slidechange", function(event, ui){
       console.log(ui.value);


       lightref.update({
         task: "brightness",
         value: ui.value
       })
     })

     $(document).on("click", "#setLightToWhite", function(){
       lightref.update({
         task: "white"
       })


       $("#brightnessSlider").slider("value",59)

     })


    $(document).on("click", "#editSensorBtn", function() { //when you open the Edit modal
        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        //console.log(task);
        var address = $(this).data('address');
        var zone = $(this).data('zone');
        var status = $(this).data('status');
        var battery = $(this).data('battery');

        var modal = $("#myModal"); //get the modal element

        if(task == "sp"){
          //person sensor
          modal.find("#editSensorTypeSelect").val("sp").change();
        }else if(task == "zone"){
          //zone sensor
          modal.find("#editSensorTypeSelect").val("zone").change();
        }else if(task == "s"){
          //idle sensor
          modal.find("#editSensorTypeSelect").val("s").change();
        }else if(task == "sc"){
          modal.find("#editSensorTypeSelect").val("sc").change();
        }else{
          //multi sensor
          modal.find("#editSensorTypeSelect").val("multi").change();

          if(task.indexOf("m") !== -1){
              $("input#m").prop("checked", true);
          }
          if(task.indexOf("l") !== -1){
              $("input#l").prop("checked", true);
          }
          if(task.indexOf("t") !== -1){
              $("input#t").prop("checked", true);
          }
          if(task.indexOf("b") !== -1){
              $("input#b").prop("checked", true);
          }

        }


        modal.find("#myModalLabel")[0].innerHTML = name; //insert variables to the element

        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;
        modal.find("input#" + task).prop("checked", true);
        modal.find("#sensorZone")[0].innerHTML = zone;
        modal.find("#sensorStatus")[0].innerHTML = status;
        modal.find("#battery")[0].innerHTML = battery;
        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;

      //  console.log(name);
    });


    $(document).on("click", "#editBespokeBtn", function() { //when you open the Edit modal
        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        //console.log(task);
        var address = $(this).data('address');
        var zone = $(this).data('zone');
        var status = $(this).data('status');
        var battery = $(this).data('battery');

        var modal = $("#editBespokeSensor"); //get the modal element
        //console.log("click + :" + name);



        modal.find("#myModalLabel")[0].innerHTML = name; //insert variables to the element
        modal.find("#spotTask")[0].innerHTML = task;
        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;
        modal.find("input#" + task).prop("checked", true);
        modal.find("#sensorZone")[0].innerHTML = zone;
        modal.find("#sensorStatus")[0].innerHTML = status;
        modal.find("#battery")[0].innerHTML = battery;
        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;

      //  console.log(name);
    });

    $(document).on('click', "#buzzSpot", function(){
      //console.log( $(this).parents(".object-card").attr('id'));
      rawAddress = $(this).parents(".object-card").attr('id');
      address = rawAddress.replace(/_/g, " ");
    //  console.log(address);

      buzzRef = new Firebase("https://sunsspot.firebaseio.com/buzz/" + address)

      buzzRef.set(1);
    })

    $(document).on("click", "#editCupBtn", function() { //when you open the Edit modal

        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        //console.log(task);
        var address = $(this).data('address');
        var zone = $(this).data('zone');
        var status = $(this).data('status');
        var battery = $(this).data('battery');

        var modal = $("#editCup"); //get the modal element

        if(task == "sp"){
          //person sensor
          modal.find("#editSensorTypeSelect").val("sp").change();
        }else if(task == "zone"){
          //zone sensor
          modal.find("#editSensorTypeSelect").val("zone").change();
        }else if(task == "s"){
          //idle sensor
          modal.find("#editSensorTypeSelect").val("s").change();
        }else if(task == "sc"){
          modal.find("#editSensorTypeSelect").val("sc").change();
        }else{
          //multi sensor
          modal.find("#editSensorTypeSelect").val("multi").change();
          if(task.indexOf("m") !== -1){
              $("input#m").prop("checked", true);
          }
          if(task.indexOf("l") !== -1){
              $("input#l").prop("checked", true);
          }
          if(task.indexOf("t") !== -1){
              $("input#t").prop("checked", true);
          }
          if(task.indexOf("b") !== -1){
              $("input#b").prop("checked", true);
          }

        }

        var volumeRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + address + "/cupStat/volume");
        volumeRef.once("value", function(snapshot){
          //console.log(snapshot.val());
          $("#editCup").find("input#volume")[0].value = snapshot.val()
        });

        modal.find("#myModalLabel")[0].innerHTML = name; //insert variables to the element

        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;
        modal.find("input#" + task).prop("checked", true);
        modal.find("#sensorZone")[0].innerHTML = zone;
        modal.find("#sensorStatus")[0].innerHTML = status;
        modal.find("#battery")[0].innerHTML = battery;
        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;

      //  console.log(name);
    });
    /**
   * When #historySensorBtn is clicked, it opens a dialog and sets spotId to its <div>
   * to allow setSensorHistoryChart to plot graph on the div
   * @author Anson Cheung
   */
    $(document).on("click", "#historySensorBtn", function() {

        var address = $(this).data('address');
        var spotId = address.slice(-4);
        var sensorType = $(this).data('task');

        ngDialog.open({
            template: '<div id="' + spotId + '_0" class="history-chart"></div>' +
                      '<div id="' + spotId + '_1" class="history-chart"></div>' +
                      '<div id="' + spotId + '_2" class="history-chart"></div>' +
                      '<div id="' + spotId + '_3" class="history-chart"></div>' +
                      '<div id="' + spotId + '_4" class="history-chart"></div>' +
                      '<div id="' + spotId + '_5" class="history-chart"></div>',
            plain: true
        });

        //console.log(sensorType);
        $scope.setSensorHistoryChart(address, spotId, sensorType);

    });
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $(document).on("click", "#viewPersonBtn", function() { //when you open the Edit modal
        var name = $(this).data('name'); //populate variables from data-attributes
        var task = $(this).data('task');
        var address = $(this).data('address');
        var zone = $(this).data('zone');
        var status = $(this).data('status');
        var battery = $(this).data('battery');
        //console.log(battery);
        var modal = $("#viewPerson");
        if(task == "sp"){
          //person sensor
          modal.find("#viewSensorTypeSelect").val("sp").change();
        }else if(task == "zone"){
          //zone sensor
          modal.find("#viewSensorTypeSelect").val("zone").change();
        }else if(task == "s"){
          //idle sensor
          modal.find("#viewSensorTypeSelect").val("s").change();
        }else{
          //multi sensor
          modal.find("#viewSensorTypeSelect").val("multi").change();
          if(task.indexOf("m") !== -1){
              $("input#vm").prop("checked", true);
          }
          if(task.indexOf("l") !== -1){
              $("input#vl").prop("checked", true);
          }
          if(task.indexOf("t") !== -1){
              $("input#vt").prop("checked", true);
          }
          if(task.indexOf("b") !== -1){
              $("input#vb").prop("checked", true);
          }

        }

        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("input#name")[0].value = name;
        modal.find("#sensorStatus")[0].innerHTML = status;
        modal.find("#battery")[0].innerHTML = battery;
        modal.find("#personZone")[0].innerHTML = zone

        var modal = $("#deleteModal");
        modal.find("#myModalLabel")[0].innerHTML = name;
        modal.find("#deleteSpotAddress")[0].innerHTML = address;

        profileSrc = $(this).parents("div.card").find("img").attr('src');
        profileSrc = profileSrc.split("/");
        //console.log(profileSrc[profileSrc.length -1]);

        profileSrc = profileSrc[profileSrc.length -1].split(".")
        //console.log(profileSrc[0]);
        profileSrc = profileSrc[0];

        $("input[name=profilePic][value="+ profileSrc +"]").prop('checked', true);

    });
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $(document).on("click", "#locationHistoryBtn", function(){

        var address = $(this).data('address');

        var modal = $("#historyPlayback");

        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("#table_div")[0].innerHTML = "";

    })


    $(document).on("click", ".card-header", function(){
      //console.log("trigger minimise");
      $(this).parent(".card").find(".card-content").toggle();
      $(this).parent(".card").find(".card-footer").toggle();
    })


    $(document).on('click', "#newAlarmBtn", function(){
      modal = $("#newAlarm");
      modal.find("#spotAddress")[0].innerHTML = $(this).data('address');

        modal.find("#newAlarmName").val("");
        modal.find("#newAlarmDay").val("");
        modal.find("#newAlarmHour").val("");
        modal.find("#newAlarmMinute").val("");
    })

    $(document).on('click', "#spotAlarmsBtn", function(){

        $("#alarmTable").empty();
        $("#newAlarmDay").datepicker();
        var name = $(this).data('name');
        var address = $(this).data('address');
        $("#newAlarmBtn").data('address', address);
        modal = $("#listAlarms");

        modal.find("#spotName")[0].innerHTML = name;
        modal.find("#spotAddress")[0].innerHTML = address;

        alarmListRef = new Firebase("https://sunsspot.firebaseio.com/spotAlarms/"+address)
           var dataTable = new google.visualization.DataTable();
           dataTable.addColumn('string','Name');
           dataTable.addColumn('string','Tone');
           dataTable.addColumn('string','Time');
           dataTable.addColumn('string','Type');
           dataTable.addColumn('string','Delete'); //button column

        alarmListRef.on("child_added", function(snapshot){
          data = snapshot.val();

          name = snapshot.key();
          tone = data.alarm;
          time = new Date(data.time);
          type = data.type;

          if(type == "o"){
            type = "Once";
            time = time.getDate() + " " + time.getMonth() + " " + time.getHours() + ":" + time.getMinutes();
          }else if(type == "d"){
            type = "Daily";
            time = time.getHours() + ":" + time.getMinutes();
          }else if(type == "w"){
            type = "Weekly";
            days = ['Monday', "Tuesday", "Wednesday","Thursday","Friday","Saturday","Sunday"];
            time = days[time.getDay()-1] + " " + time.getHours() + ":" + time.getMinutes();
          }
        //  console.log("Name: " + name + " Tone: " + tone + " Time: " + time + " Type: " + type);

        button = "<button id='deleteAlarmBtn' type='button' class='btn btn-danger' data-name='"+name+"' data-address='"+address+"' data-toggle='modal' data-target='#deleteAlarm'')><span class='fa fa-trash-o'></span></button>";
          dataTable.addRow([name,tone,time,type, {v:'Delete', f:button}]);
          var table = new google.visualization.Table(document.getElementById('alarmTable'));

          table.draw(dataTable, {allowHtml: true, width: '100%', height: '100%'});

        });
    });

      $(document).on('click', "#deleteAlarmBtn", function(){
        var address = $(this).data('address');
        var name = $(this).data('name');

        modal = $("#deleteAlarm");

        modal.find("#spotAddress")[0].innerHTML = address;
        modal.find("#alarmName")[0].innerHTML = name;





      })

    /*
        Kettle Boil Animation
        @author Liam Cottier
    */
    var boilInterval;
    var coolInterval;
    $(document).on('click', "#boilKettleBtn", function(){

        clearInterval(boilInterval);
        clearInterval(coolInterval);

        var element = $("#kettleCard");
        var startTime = Date.now();
        var currentTime;
        var tempoutput = $(element).find("#kettleIcon")[0];
        var tempScale = ["#00FF00","#44FF00","#99FF00","#DDFF00","#FFEE00","#FFBB00","#FF8800","#FF5500","#FF2200","#FF0000"];
        var tempScaleIndex = 0;
        var temp = parseInt($("input[name=kettleTemperature]:checked")[0].value);

        var kettleRef = new Firebase("https://sunsspot.firebaseio.com/kettle");

        kettleRef.update({boil: true, temperature: temp});

        boilInterval = setInterval(function(){
            if(tempScaleIndex >= 9){
                clearInterval(boilInterval);
                coolInterval = setInterval(function(){
                    if(tempScaleIndex <= 0){clearInterval(coolInterval); $(tempoutput).animate({color: "#000000"},1000);}
                    console.log(tempScaleIndex);
                    $(tempoutput).animate({color: tempScale[tempScaleIndex]},1000);
                    tempScaleIndex --;
                },1000);
            }
            console.log(tempScaleIndex);
            $(tempoutput).animate({color: tempScale[tempScaleIndex]},2000);
            tempScaleIndex ++;
        },2000);
    })
    
    /*
        Kettle Add
        @author Liam Cottier
    */
    $scope.newKettleSubmit = function(){

      var modal = $("#newKettle");
      //console.log(address);
      var temp = modal.find("#newKettleTemp").find(":selected").val();

      var hour = modal.find("#newKettleHour").val();
      var minute = modal.find("#newKettleMinute").val();
      var time = "" + hour + minute;

      saveRef = new Firebase("https://sunsspot.firebaseio.com/kettle/timer/"+time);

      saveRef.set(temp);


    }
    

    /*
        Kettle Fill
        @author Liam Cottier
    */
    $(document).on('click', "#kettleAutomation", function(){

        $("#kettleTable").empty();
        modal = $("#listKettles");

        kettleListRef = new Firebase("https://sunsspot.firebaseio.com/kettle/timer");
           var dataTable = new google.visualization.DataTable();
           dataTable.addColumn('string','Time');
           dataTable.addColumn('string','Temperature');
           dataTable.addColumn('string','Delete'); //button column

        kettleListRef.on("child_added", function(snapshot){

          time = snapshot.key();
          temp = snapshot.val();

        button = "<button id='deleteKettleTime' type='button' class='btn btn-danger' data-name='"+time+"' data-toggle='modal' data-target='#deleteKettleModal'')><span class='fa fa-trash-o'></span></button>";
          dataTable.addRow([time,temp, {v:'Delete', f:button}]);
          var table = new google.visualization.Table(document.getElementById('kettleTable'));

          table.draw(dataTable, {allowHtml: true, width: '100%', height: '100%'});

        });
    });

    
    $(document).on('click', "#deleteKettleBtn", function(){
        var time = $(this).data('name');
        console.log(time);
        var kettleRef = new Firebase("https://sunsspot.firebaseio.com/kettle/timer/"+time);

        kettleRef.remove();

    })

    $(document).on('click', "#deleteKettleTime", function(){
        var time = $(this).data('name');
        $("#deleteKettleModal").find("#deleteKettleBtn").data('name', time);
    })



    /*
        Kettle Boil Animation
        @author Liam Cottier
    */
    $(document).on('click', "#kettleOffBtn", function(){
        clearInterval(boilInterval);
        clearInterval(coolInterval);
        var element = $("#kettleCard");

        var kettleRef = new Firebase("https://sunsspot.firebaseio.com/kettle");

        kettleRef.update({boil: false});

        var tempoutput = $(element).find("#kettleIcon")[0];
        $(tempoutput).animate({color: "#000000"},1000);
    })

    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $("#editSensorTypeSelect").change(function(){
      //console.log("select change");
      if($(this).val() == "multi"){
        $("#editSensorCheckbox").removeClass("hidden");
      }else{
        $("#editSensorCheckbox").addClass("hidden");
      }
    })

    $("#editCupTypeSelect").change(function(){
      //console.log("select change");
      if($(this).val() == "multi"){
        $("#editCupCheckbox").removeClass("hidden");
      }else{
        $("#editCupCheckbox").addClass("hidden");
      }
    })
    /**
     * DESCRIPTION
     * @author Josh Stennett
     */
    $("#viewSensorTypeSelect").change(function(){
      //console.log("Select changed!");
      //console.log($(this).val());
      if($(this).val() == "multi"){
        $("#viewSensorCheckbox").removeClass("hidden");
      }else{
        $("#viewSensorCheckbox").addClass("hidden");
      }
    })
  }

$scope.configureBases = function(){
  console.log("config bases");
    $("#baseForm").empty();
  var basesRef = new Firebase("https://sunsspot.firebaseio.com/bases");

  basesRef.once("value",function(snapshot){

    var bases = snapshot.val();
    //console.log(bases);
    for (var address in bases){
      //console.log(address);
      //console.log(bases[address]);

      var formEntry = $("#baseFormTemplate").clone()

      $(formEntry).find("label")[0].innerHTML = address;
      $(formEntry).find("input").val(bases[address]);

      $("#baseForm").append(formEntry);

      $(formEntry).removeClass('hidden');
    }
  })



}

$scope.saveBaseConfig = function(){
  console.log("save bases");

  var form = $("#baseForm");

  $(form).find("label").each(function(){
      address = $(this)[0].innerHTML;

      zoneID = parseInt($(this).parents("div.form-group").find("input")[0].value)

      console.log("Address: " +  address + " Zone: " + zoneID);

      baseRef = new Firebase("https://sunsspot.firebaseio.com/bases");

      var data = {}
      data[address] = zoneID;

      baseRef.update(data);

  })


/*
  var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

  updateRef.child(address).set({
      name: newName,
      task: newTask,
      zone: newZone,
      alive: status,
      battery: newBattery
  }); //update the record with the new data
*/


}


$scope.newAlarmSubmit = function(){

  var modal = $("#newAlarm");
  var address = modal.find("#spotAddress")[0].innerHTML;
  //console.log(address);
  var name = modal.find("#newAlarmName").val();
  var tune = modal.find("#newAlarmTune").find(":selected").val();
  var type = modal.find("#newAlarmType").find(":selected").val();

  var date = modal.find("#newAlarmDay").val().split('/');
  //console.log(date);
  var day = date[1]
  var month = date[0]
  var year = date[2]
  var hour = modal.find("#newAlarmHour").val();
  var minute = modal.find("#newAlarmMinute").val();
  var alarmTime = new Date();
  alarmTime.setMinutes(minute);
  alarmTime.setHours(hour);
  alarmTime.setDate(day);
  alarmTime.setMonth(month-1);
  alarmTime.setFullYear(year);

  saveRef = new Firebase("https://sunsspot.firebaseio.com/spotAlarms/"+address+"/"+name);

  saveRef.set({
      alarm: tune,
      time: alarmTime.getTime(),
      type: type
  })


}

$scope.deleteAlarm = function(){
  var address = $("#deleteAlarm").find("#spotAddress")[0].innerHTML;
  var name = $("#deleteAlarm").find("#alarmName")[0].innerHTML;

  //console.log("DELETE: " + address + name);

  deleteRef = new Firebase("https://sunsspot.firebaseio.com/spotAlarms/"+address+"/"+name);

  deleteRef.remove();
}
  /**
   * DESCRIPTION
   * @param {type} paramName - Description.
   * @author Josh Stennett
   */
  $scope.deleteSubmit = function() {
    //console.log("in func");
      var address = document.getElementById('deleteSpotAddress').innerHTML; //read in the address

      console.log("Deleting " + address); //log the delete address just in case

      var delRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/" + address); //programatically generate the reference url
      var delReadingsRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + address);
      var delMapRef = new Firebase("https://sunsspot.firebaseio.com/map/" + address);
      delRef.remove(); //call the remove function to remove the data from Firebase
      delReadingsRef.remove();
      delMapRef.remove() //delete the spot from the map, as well.
      $("#" + address.replace(/ /g, "_")).remove(); //remove th element from the DOM
      $('.modal').modal('hide');

      pushNotification("Spot successfully deleted.");
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
      var newZone = parseInt(modal.find("span#sensorZone")[0].innerHTML);
      var newTask = modal.find('#editSensorTypeSelect').val();
      var status = modal.find("#sensorStatus")[0].innerHTML;

      if(status == "true"){
        status = true;
      }else{
        status = false;
      }

      var newBattery = modal.find("#battery")[0].innerHTML;
      if(newTask == "multi"){
        var multiTask = "s";
        if($("input#m").is(':checked')){

          multiTask += "m";
        }
        if($("input#l").is(':checked')){

          multiTask += "l";
        }
        if($("input#t").is(':checked')){

          multiTask += "t";
        }
        if($("input#b").is(':checked')){

          multiTask += "b";
        }
        newTask = multiTask;
      }

      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone,
          alive: status,
          battery: newBattery
      }); //update the record with the new data
      $("input#m").prop("checked", false);
      $("input#l").prop("checked", false);
      $("input#t").prop("checked", false);
      $("input#b").prop("checked", false);
  };

  $scope.bespokeSubmit = function() {

      var modal = $("#editBespokeSensor")
      var address = modal.find("#spotAddress")[0].innerHTML //populate variables based off of form values
      var newName = modal.find("#name")[0].value;
      var newZone = parseInt(modal.find("span#sensorZone")[0].innerHTML);
      var newTask = modal.find("#spotTask")[0].innerHTML;
      var status = modal.find("#sensorStatus")[0].innerHTML;

      if(status == "true"){
        status = true;
      }else{
        status = false;
      }

      var newBattery = modal.find("#battery")[0].innerHTML;


      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone,
          alive: status,
          battery: newBattery
      }); //update the record with the new data

  };



  $scope.cupSubmit = function() {

      var modal = $("#editCup")
      var address = modal.find("#spotAddress")[0].innerHTML //populate variables based off of form values
      var newName = modal.find("#name")[0].value;
      var newZone = parseInt($("span#sensorZone")[0].innerHTML);
      var newTask = modal.find('#editCupTypeSelect').val();
      var status = modal.find("#sensorStatus")[0].innerHTML;
      var newBattery = modal.find("#battery")[0].innerHTML;

      var newVolume = parseInt(modal.find("input#volume")[0].value);

      if(newTask == "multi"){
        var multiTask = "s";
        if($("input#m").is(':checked')){

          multiTask += "m";
        }
        if($("input#l").is(':checked')){

          multiTask += "l";
        }
        if($("input#t").is(':checked')){

          multiTask += "t";
        }
        if($("input#b").is(':checked')){

          multiTask += "b";
        }
        newTask = multiTask;
      }

      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone,
          alive: status,
          battery: newBattery
      }); //update the record with the new data

      var volumeRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + address +"/cupStat/")
      volumeRef.update({volume: newVolume});


      $("input#m").prop("checked", false);
      $("input#l").prop("checked", false);
      $("input#t").prop("checked", false);
      $("input#b").prop("checked", false);
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
    var newZone = parseInt($("span#personZone")[0].innerHTML);
    var status = modal.find("#sensorStatus")[0].innerHTML;
    var newBattery = modal.find("#battery")[0].innerHTML;
    var newTask = modal.find('#viewSensorTypeSelect').val();
    if(newTask == "multi"){
      var multiTask = "s";
      if($("input#vm").is(':checked')){

        multiTask += "m";
      }
      if($("input#vl").is(':checked')){

        multiTask += "l";
      }
      if($("input#vt").is(':checked')){

        multiTask += "t";
      }
      if($("input#vb").is(':checked')){

        multiTask += "b";
      }
      newTask = multiTask;
    }

      var chosenProfilePic = $('input[name=profilePic]:checked').val();
      //console.log("Profile pic : " + chosenProfilePic);
      var profRef =  new Firebase("sunsspot.firebaseio.com/spotProfile/"+address+"/FileName")
      profRef.set(chosenProfilePic + ".jpg");

      var personCard = $("#" +address.replace(/ /g, "_"))
      $(personCard).find("#profileImage").find("img").attr('src', '../images/profile/' + chosenProfilePic + ".jpg");


      var updateRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings/"); //create reference

      updateRef.child(address).set({
          name: newName,
          task: newTask,
          zone: newZone,
          alive: status,
          battery: newBattery
      }); //update the record with the new data


          $("input#vm").prop("checked", false);
          $("input#vl").prop("checked", false);
          $("input#vt").prop("checked", false);
          $("input#vb").prop("checked", false);

  };

    /**
     * Generate a annotation graph and set it to a <div>
     * @param {String} address - Full address of a sensor.
     * @param {String} spotId - The last 4 letters of the spot's ID. Example: '76D3', '797D'.
     * @author Anson Cheung
     */
    $scope.setSensorHistoryChart = function(address, spotId, sensorType){
        var sensorTypeName = [];

        for(i in sensorType){
          switch(sensorType[i]){

            case 'm':
              sensorTypeName[i] = "motion";
              break;

            case 'l':
              sensorTypeName[i] = "light";
              break;

            case 't':
              sensorTypeName[i] = "temperature";
              break;

            case 'b':
              sensorTypeName[i] = "button";
              break;

            default:
              sensorTypeName[i] = sensorType[i];
          }
        }

        for(i in sensorTypeName){

          //Only showing motion, light, temperature, button graphs
          if(sensorTypeName[i].length > 1){

            var address = trim(address); //Replace spaces with %20%

            var spotRef = new Firebase("https://sunsspot.firebaseio.com/spotReadings/" + address + "/" + sensorTypeName[i]);

            $scope.populateChart(spotRef, spotId, i, sensorTypeName[i]);
          }
        }

    }

    /**
     * Populate data into chart
     * (Google visualization has been called in index.html so google.load("visualization") is redundant here
     * @param {Object} spotRef - Full address of a sensor.
     * @param {String} spotId - The last 4 letters of the spot's ID. Example: '76D3', '797D'.
     * @param {int} i - Index of sensorTypeName[]
     * @param {String} sensorTypeName - Name of the sensor.
     * @author Anson Cheung
     */
    $scope.populateChart = function(spotRef, spotId, i, sensorTypeName){

      var data = new google.visualization.DataTable();
      data.addColumn('date', 'Date');
      data.addColumn('number', sensorTypeName);

      spotRef.once("value", function(snapshot) {
        var newLog = snapshot.val();

        for (var log in newLog)
            data.addRow([new Date(newLog[log].timestamp),newLog[log].newVal]);

        drawChart(data, spotId + '_' + i, ['#004D40', '#00695C', '#00796B']);
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



spotApp.controller('mapController', ['$scope','$firebaseObject', '$firebaseArray', '$q',
function($scope, $firebaseObject, $firebaseArray, $q) {

        //Set map map reference
        var mapRef = new Firebase("https://sunsspot.firebaseio.com/map");
        var spotSettingsRef = new Firebase("https://sunsspot.firebaseio.com/spotSettings");

        $scope.objIndexList = [];
        $scope.objSettingsList = [];

        //Synchronize map->spot references into array
        mapRef.once("value", function(snapshot){
            var i = 0;
            snapshot.forEach(function(childSnapshot){
                var ref = mapRef.child(childSnapshot.key());
                $scope.objIndexList[i] = new $firebaseObject(ref);
                i++;
            });
        });

        //Synchronize spotReadings->spot references into array
        spotSettingsRef.once("value", function(snapshot){
            var i = 0;
            snapshot.forEach(function(childSnapshot){
                var ref = spotSettingsRef.child(childSnapshot.key());
                $scope.objSettingsList[i] = new $firebaseObject(ref);
                i++;
            });
        });


        /**
         * Merge three objects to return a new array
         * @param {obj} objA - First object you want to merge.
         * @param {obj} objB - Second object you want to merge.
         * @return {array} - An array of three merged objects.
         * @author Anson Cheung
         */
        $scope.mergeObjects = function(objA, objB){
            var mergedObjects = [];

            for(i in objA)
                for(j in objB)
                        if(objA[i].$id == objB[j].$id)
                            mergedObjects.push(angular.extend(objA[i], objB[j]));

            return mergedObjects;
        }


        /**
         * Creating a range between two defined numbers, eg. 5 to 15
         * @param {min} min - Min number of the starting range.
         * @param {max} max - Max number of the starting range..
         * @param {step}(Optional) step - Steps in between each loop, in default, it sets to 1.
         * @return {array} - An array of a range of two defined numbers.
         * @author Anson Cheung
         */
        $scope.rangeIn = function(min, max, step){
            step = step || 1;
            var array = [];

            for (var i = min; i <= max; i += step)
              array.push(i);

            return array;
        };


        $scope.zone1 = []; //Range of zone 1
        $scope.zone2 = []; //Range of zone 2
        $scope.zone3 = []; //Range of zone 3

        //Set zone 1 range
        var gap = 33;
        var skip = 10;

        var start = 0;
        $scope.zone1 = $scope.zone1.concat($scope.rangeIn(start, start + skip))
                                   .concat($scope.rangeIn(start + gap * 1, start + gap * 1 + skip))
                                   .concat($scope.rangeIn(start + gap * 2, start + gap * 2 + skip))
                                   .concat($scope.rangeIn(start + gap * 3, start + gap * 3 + skip))
                                   .concat($scope.rangeIn(start + gap * 4, start + gap * 4 + skip))
                                   .concat($scope.rangeIn(start + gap * 5, start + gap * 5 + skip))
                                   .concat($scope.rangeIn(start + gap * 6, start + gap * 6 + skip))
                                   .concat($scope.rangeIn(start + gap * 7, start + gap * 7 + skip))
                                   .concat($scope.rangeIn(start + gap * 8, start + gap * 8 + skip))
                                   .concat($scope.rangeIn(start + gap * 9, start + gap * 9 + skip))
                                   .concat($scope.rangeIn(start + gap * 10, start + gap * 10 + skip));

        //Set zone 2 range
        var start = 11;
        $scope.zone2 = $scope.zone2.concat($scope.rangeIn(start, start + skip))
                                   .concat($scope.rangeIn(start + gap * 1, start + gap * 1 + skip))
                                   .concat($scope.rangeIn(start + gap * 2, start + gap * 2 + skip))
                                   .concat($scope.rangeIn(start + gap * 3, start + gap * 3 + skip))
                                   .concat($scope.rangeIn(start + gap * 4, start + gap * 4 + skip))
                                   .concat($scope.rangeIn(start + gap * 5, start + gap * 5 + skip))
                                   .concat($scope.rangeIn(start + gap * 6, start + gap * 6 + skip))
                                   .concat($scope.rangeIn(start + gap * 7, start + gap * 7 + skip))
                                   .concat($scope.rangeIn(start + gap * 8, start + gap * 8 + skip))
                                   .concat($scope.rangeIn(start + gap * 9, start + gap * 9 + skip))
                                   .concat($scope.rangeIn(start + gap * 10, start + gap * 10 + skip));

        //Set zone 3 range
        var start = 22;
        $scope.zone3 = $scope.zone3.concat($scope.rangeIn(start, start + skip))
                                   .concat($scope.rangeIn(start + gap * 1, start + gap * 1 + skip))
                                   .concat($scope.rangeIn(start + gap * 2, start + gap * 2 + skip))
                                   .concat($scope.rangeIn(start + gap * 3, start + gap * 3 + skip))
                                   .concat($scope.rangeIn(start + gap * 4, start + gap * 4 + skip))
                                   .concat($scope.rangeIn(start + gap * 5, start + gap * 5 + skip))
                                   .concat($scope.rangeIn(start + gap * 6, start + gap * 6 + skip))
                                   .concat($scope.rangeIn(start + gap * 7, start + gap * 7 + skip))
                                   .concat($scope.rangeIn(start + gap * 8, start + gap * 8 + skip))
                                   .concat($scope.rangeIn(start + gap * 9, start + gap * 9 + skip))
                                   .concat($scope.rangeIn(start + gap * 10, start + gap * 10 + skip));

        /**
         * Update object's location when it's dropped to a new location
         * @param {Object} data - an object that contains a sensor's data.
         * @param {evt} event - Indicate the type of mouse event.
         * @param {int} indexNumber - The current index of an array.
         * @author Anson Cheung
         */
        $scope.onDropComplete=function(data, evt, indexNumber){

            var ref = new Firebase("https://sunsspot.firebaseio.com/map/" + trim(data.$id));

            ref.once("value", function(snapshot){
               ref.set({mainIndex: indexNumber});
            })

        }


        /**
         * Return an array of a desired range of numbers.
         * @param {int} num - The length of an array.
         * @return {Array(num)} - Return an array of numbers.
         * @author Anson Cheung
         */
        $scope.range = function(num) {
            return new Array(num);
        }




}]);


function trim(string){
  return string.replace(/\s+/g, '%20');
}


// Please note that $modalInstance represents a modal window (instance) dependency.
// It is not the same as the $uibModal service used above.
spotApp.controller('zoneHistoryCtrl', function ($rootScope, $firebaseObject, $firebaseArray, $scope, $filter, $interval, $timeout, $uibModalInstance, zoneHistory, zoneReference, zoneNumber, type) {
    console.log(zoneNumber);
    console.log(type);
    $scope.isCollapsed = true;
    if(type=='light'){
        $scope.unit = '(lm)';
    }else{
        $scope.unit = '(℃)'
    }
  $scope.zoneData = zoneHistory;

  $scope.dataFirst = $firebaseArray(zoneReference.orderByChild("timestamp").limitToFirst(1));
  $scope.dataLast = $firebaseArray(zoneReference.orderByChild("timestamp").limitToLast(1));

    $scope.options = {
      axes: [
        {
          axis: "y",
          series: [
            "id_0", "id_1"
          ]
        }
      ],
      lineMode: "cardinal",
      series: [
        {
          id: "id_0",
          y: "val_0",
          label: type + " A",
          type: "area",
          color: "#1f77b4"
        },
        {
          id: "id_1",
          y: "val_1",
          label: type + " B",
          type: "area",
          color: "#ff7f0e"
        },
      ],
      tooltip: {
        mode: "scrubber",
            formatter: function (x, y, series) {
                if(series.id == "id_0"){
                    var date = $filter('date')($scope.data1[x].timestamp, 'short');
                }else{
                    var date = $filter('date')(new Date($scope.data2[x].timestamp), 'short');
                }
                return date + ' : ' + y + $scope.unit;
            }
        }
    };

  $scope.get = function(startAt, endAt, nextStart){


    var nextEnd = nextStart + (endAt - startAt);

    console.log('startAt:     ' + new Date(startAt));
    console.log('endAt:       ' + new Date(endAt));
    console.log('Date Length: ' + new Date(endAt - startAt));
    console.log('nextStart:   ' +  new Date(nextStart));
    console.log('nextEnd:     ' + new Date(nextEnd));

    $scope.data1 = $firebaseArray(zoneReference.orderByChild("timestamp").startAt(startAt).endAt(endAt));
    $scope.data2 = $firebaseArray(zoneReference.orderByChild("timestamp").startAt(nextStart).endAt(nextEnd));

  }

    $scope.push = function(length) {

        $scope.data = []; //Initialize and clear data

        if(type=='light'){
            for(var i=0;i<length;i++){
                $scope.data.push({
                    x: i,
                    val_0: $scope.data1[i].light,
                    val_1: $scope.data2[i].light
                });
            }
        }else{
            for(var i=0;i<length;i++){
                $scope.data.push({
                    x: i,
                    val_0: ($scope.data1[i].temp).toFixed(2),
                    val_1: ($scope.data2[i].temp).toFixed(2)
                });
            }
        }


    }

    $scope.loadData = function(floor, ceil){

    $scope.slider = {
      startAt: floor,
      endAt: ceil,
      nextStartAt: ceil + 600000,
      options: {
        floor: floor,
        ceil: ceil,
        step: 60000,
        draggableRange: true,
        translate: function(value) {
          return $filter('date')(value, 'short');
        }
      }
    };

        // $scope.zoneRef = $firebaseObject(zoneReference);
    }
    $scope.status = 'Load';
    $scope.isDisabled = false;
    $scope.message = null;

    var promise;
    $scope.play = function(){
        $scope.isDisabled = true;
         $scope.status = 'Rendering data...';
        // console.log("play buttion pressed.");
        var i = 0;
        promise = $interval(function(){
            if(i==0){
                $scope.get($scope.slider.startAt, $scope.slider.endAt, $scope.slider.nextStartAt);
                i++;
            }else if(i==1){

                if($scope.data2.length > $scope.data1.length){
                    $scope.push($scope.data1.length);
                    i++;
                }else{
                    $scope.push($scope.data2.length);
                    i++;
                }

                if($scope.data1.length == 0){
                    $scope.message = 'Found no data in the first selection. Please select another range.';
                }else if($scope.data2.length == 0){
                    $scope.message = 'Found no data in the second selection. Please select another range.';
                }else if($scope.data1.length == 0 && $scope.data2.length == 0){
                    $scope.message = 'Please select range.';
                }else{
                    $scope.message = null;
                }
            }else{
                $scope.stop();
                $scope.isDisabled = false;
                $scope.status = 'Load';
            }

                    }, 500);

    }

    $scope.stop = function(){
        $interval.cancel(promise);
        promise = $timeout(function(){
        }, 1000);
    }


  $scope.close = function () {
    $uibModalInstance.dismiss('close');
  };

});
