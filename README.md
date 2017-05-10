Angular-Custom-Geofence

Geofence Directive for AngularJS

PART 1 : Allows you to draw custom areas using shapes like(circle/polygon) for geofencing called as zones.

PART 2 : Same Zones act as boundaries inside which you can draw smaller areas.

Usage

in HTML.

\<ng-geofence zones="myZones" boundaries="myBoundaries" geo-map="geoMap" is-zone="isZone"></ng-geofence>

where,
myZones : is an array of geojson data containing areas(shapes data).

myBoundaries : is an array of geojson data(myZones) which act as geofence.

geoMap : is an object containing formatted_address of partners Location and its Latitude and Longitude.

is-zone : is boolean value to check whether to draw shapes or geoefence.

in JS file
$scope.myZones = [];

$scope.myBoundaries = [];

$scope.geoMap = {};

$scope.isZone = false; // set it true for PART 1

Steps To Install

Prerequisites.

	-node.
	
	-npm.

1) To load the google maps, you'll need to include the below script tag in your index.html
	<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=drawing,places"></script>
	for details, refer: https://developers.google.com/maps/documentation/javascript.

2) you'll need to include following dependencies in your project.
	-Twitter Bootstrap (JS AND CSS).
	-jQuery.

3) bower install git://github.com/hetal393/angular-geofence.git --save.

4) gulp.


Note: You can save this geofence data in a NodeJS-MongoDB powered backend.
