const util = require('util');
const fs = require('fs');

const ical = require("ical");
const request = require("request-promise");
//request.debug = true

const moment = require('moment');
require('moment-timezone');
//sydney trains api
//const TripPlanner = require('trip_planner');
const {TripPlannerAPI, APIConstants} = require('./tripPlanner');

//uts timetable reccomendations
const timetableURL = "https://mytimetable.uts.edu.au/aplus2018/rest/calendar/ical/d75d46cd-2d7c-4f74-8bf9-babc060fd716";


const stopIds = {
	central: "10101100",
	mountDruitt: "10101248"
}

const icalURLPromise = util.promisify(ical.fromURL);

/*
let classes = [{
		startTime: null, //type moment
		endTime: null,	//type moment
		summary: null,
		description: null,
		location: null
	},
]
*/
function parseClasses(events) {
	const classes = [];
	for (let k in events){
		if (events.hasOwnProperty(k)) {
		  const ev = events[k]
		  const classEv = {};
		  try {
			  //console.log(ev.start);
			  classEv.startTime = moment(ev.start, "Australia/Melbourne")
			  classEv.endTime = moment(ev.end, "Australia/Melbourne");
			  classEv.summary = ev.summary;
			  classEv.description = ev.description;
			  classEv.location = ev.location;
			  classes.push(classEv);
			  //console.log(classEv);
		  }
		  catch (e) {
			  console.log(e);
			  continue;
		  }
		}
		//console.log(classes)
	}	
	return classes;
}

function getNextClass(classes) {
	const timeNow = moment();
	return classes.find(classEv => {
		return classEv.startTime > timeNow;
	});
}

async function getAllEvents() {
	const timetableParsed = await parseIcal();
	//console.log(timetableParsed);
	return timetableParsed;
}

async function parseIcal() {
	return await icalURLPromise(timetableURL, {});
}

async function init() {
	//load API key
	const apiKey = fs.readFileSync('api.key', { encoding: 'utf-8'});
	//console.log(apiKey);
	
	//check if local copy of timetable exists
	//if (!fs.existsSync(timetableURL.split('/').pop()))	

	const tripPlannerAPI = new TripPlannerAPI(apiKey);



	const data = await tripPlannerAPI.trip({
		depArrMacro: APIConstants.depArrOpts.depart,
		itdDate: moment().format("YYYYMMDD"),
		itdTime: moment().format("HHMM"),
		type_origin: APIConstants.stopTypes.any,
		name_origin: stopIds.mountDruitt,
		type_destination: APIConstants.stopTypes.any,
		name_destination: stopIds.central,
		calcNumberOfTrips: 8,
		excludedMeans: "checkbox",
		exclMOT_4: 1,
		exclMOT_5: 1,
		exclMOT_7: 1,
		exclMOT_9: 1,
	});
	console.log(util.inspect(data, {depth: null}));
	// try {
	// 	const data = await tripPlannerRequest(outputFormat, "EPSG:4326", "dep", moment().format("YYYYMMDD"), moment().format("HHMM"), 
	// 		"any", stopIds.mountDruitt, "any", stopIds.central, {calcNumberOfTrips: 8});
	// }
	// catch(e) {
	// 	console.log(e);
	// }
	// console.log(data);

	// const data = await request({
	// 	uri: "https://api.transport.nsw.gov.au/v1/tp/trip?outputFormat=rapidJSON&coordOutputFormat=EPSG%3A4326&depArrMacro=dep&itdDate=20180410&itdTime=18%3A18&type_origin=any&name_origin=10101248&type_destination=any&name_destination=10101100&calcNumberOfTrips=6&TfNSWTR=true&version=10.2.1.42",
	// 	headers: {
	// 		"Authorization": " apikey kedzrYyEgrdZr1bwsmVclCloArogBPBlTM5m"
	// 	},
	// 	json: true
	// });
	// console.log(data);
	
	const events = await getAllEvents();
	try {
		classes = parseClasses(events);
		classes.sort((a, b) => a.startTime - b.startTime);
		console.log(getNextClass(classes));
		//console.log(classes);
	} catch(e) {
		console.log(e);
	}
}


init()

/*
ical.fromURL(timetableURL, {}, function(err, data){
	console.log(data)
})*/