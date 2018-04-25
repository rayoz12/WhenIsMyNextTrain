const util = require('util');
const fs = require('fs');

const express = require('express');
const exphbs  = require('express-handlebars');


const ical = require("ical");
const request = require("request-promise");
//request.debug = true

const moment = require('moment');
require('moment-timezone');
//sydney trains api
//const TripPlanner = require('trip_planner');
const {TripPlannerAPI, APIConstants} = require('./tripPlanner');
const tripParser = require("./tripParser");

//uts timetable reccomendations
const timetableURL = "https://mytimetable.uts.edu.au/aplus2018/rest/calendar/ical/d75d46cd-2d7c-4f74-8bf9-babc060fd716";


const stopIds = {
	central: "10101100",
	mountDruitt: "10101248"
}

const icalURLPromise = util.promisify(ical.fromURL);

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


function tripToString(trip) {
	let str = "";
	str += `${trip.originName.split(", ")[1]} == TO ==> ${trip.destName.split(", ")[1]}` + "\n";
	str += "Scheduled Running Times: \n"
	str += `Depart: ${trip.depart.planned.format("dddd, h:mm a")} (${trip.depart.planned.fromNow()})` + "\n";
	str += `Arrive: ${trip.arrival.planned.format("dddd, h:mm a")} (${trip.arrival.planned.fromNow()})` + "\n";
	const delayedMinutes = trip.depart.planned.diff(trip.depart.estimated, 'minutes')
	if (delayedMinutes > 0) {
		str += `Train is running ${delayedMinutes} minutes(s) late. New Depart:` + "\n";
		str += `Depart: ${trip.depart.estimated.format("dddd, h:mm a")} (${trip.depart.estimated.fromNow()}` + "\n";
	}
	str += `Cost:${trip.fare['SCHOLAR']}` +  "\n";
	str += "Stops for this Trip: \n";
	for (let i = 0; i < trip.stops.length; i++) {
		const stop = trip.stops[i];
		const delayedStopMinutes = stop.time.planned.diff(stop.time.estimated, 'minutes');
		if (delayedStopMinutes > 0)
			str += `${stop.name}: ${stop.time.estimated.format("h:mm a")} (${delayedStopMinutes} mins late), ` + "\n"
		else
			str += `${stop.name}: ${stop.time.planned.format("h:mm a")}, ` + "\n"
	}
	return str;
}

let apiKeys, accounts, tripPlannerAPI, classes;

async function init() {
	//load API key
	apiKeys = JSON.parse(fs.readFileSync('apiKeys.json', { encoding: 'utf-8'}));
	//load accounts
	accounts = JSON.parse(fs.readFileSync('accounts.json', { encoding: 'utf-8'}));

	//console.log(apiKey);
	
	//check if local copy of timetable exists
	//if (!fs.existsSync(timetableURL.split('/').pop()))	

	tripPlannerAPI = new TripPlannerAPI(apiKeys.trains);
	const events = await getAllEvents();
	try {
		classes = parseClasses(events);
		classes.sort((a, b) => a.startTime - b.startTime);
		//nextClass = getNextClass(classes);
		//console.log(classes);
	} catch(e) {
		console.log(e);
	}
	/*
	console.log("Next Class:", nextClass);
	
	const data = await tripPlannerAPI.trip({
		depArrMacro: APIConstants.depArrOpts.arrive,
		itdDate: moment().format("YYYYMMDD"),
		//itdTime: moment().format("HHMM"),
		itdTime: nextClass.startTime.clone().subtract(10, 'minutes').format("HHmm"),
		type_origin: APIConstants.stopTypes.any,
		name_origin: stopIds.mountDruitt,
		type_destination: APIConstants.stopTypes.any,
		name_destination: stopIds.central,
		calcNumberOfTrips: 6,
		excludedMeans: "checkbox",
		exclMOT_4: 1,
		exclMOT_5: 1,
		exclMOT_7: 1,
		exclMOT_9: 1,
	});
	//console.log(util.inspect(data, {depth: null}));

	//fs.writeFile('tripData.json', JSON.stringify(data));
	console.log("-------------------Parsed data---------------------");
	const trips = tripParser(data);
	//console.log(util.inspect(trips, {depth: null}));

	trips.sort((a, b) => a.depart.planned - b.depart.planned);

	for (let i = 0; i < trips.length; i++) {
		const trip = trips[i];
		console.log(tripToString(trip))
	}
	*/
}


init();

const app = express();
app.use(express.urlencoded({ extended: true }));


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

app.get('/', function (req, res) {
    res.render('login');
});

app.post('/login', function (req, res) {
	console.log(req.body || "no body");
	const login = req.body;
	let found = false;
	for (account of accounts) {
		if (account.username === login.username && account.password === login.password)
			found = true;
	}
	if (!found) {
		res.status(400).send("Invalid account details");
		reuturn;
	}

	res.render("trainView");

});

app.get('/getNextTrainForClass', async (req, res) => {
	if (!(req.header("apiKey") == apiKeys.serviceKey)) {
		res.end();
		return;
	}

	const nextClass = getNextClass(classes);
	const returnObj = {
		nextClass,
	};
	let data;
	try {
		data = await tripPlannerAPI.trip({
			depArrMacro: APIConstants.depArrOpts.arrive,
			itdDate: moment().format("YYYYMMDD"),
			//itdTime: moment().format("HHMM"),
			itdTime: nextClass.startTime.clone().subtract(10, 'minutes').format("HHmm"),
			type_origin: APIConstants.stopTypes.any,
			name_origin: stopIds.mountDruitt,
			type_destination: APIConstants.stopTypes.any,
			name_destination: stopIds.central,
			calcNumberOfTrips: 6,
			excludedMeans: "checkbox",
			exclMOT_4: 1,
			exclMOT_5: 1,
			exclMOT_7: 1,
			exclMOT_9: 1,
		});
	}
	catch (e) {
		res.status(500).send("Failed to access train API");
		return;
	}
	
	const trips = tripParser(data);

	returnObj.trips = trips;

	res.json(returnObj);
})

console.log("Listening on 6515");
app.listen(6515);

/*
ical.fromURL(timetableURL, {}, function(err, data){
	console.log(data)
})*/