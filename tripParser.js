/*

Ths file just takes the trip data and extracts the data that i need into an easier format.

JSON data structure for trips is:

object root:
    journeys: []    // array of possible trips to and from destination
        {
            rating:
            isAdditional:
            interchanges:   //stations you change at?
            legs[0]: []       //the trips between the legs[0]
                {
                    duration:   // time in seconds,
                    origin: {}
                }
        }



*/

const moment = require("moment");

function parseJourneys(data) {
    const trains = [];
    for (let i = 0; i < data.journeys.length; i++) {
        const journey = data.journeys[i];
        const lastLegIndex = journey.legs.length - 1;
        const train = {
            originName: journey.legs[0].origin.name,
            destName: journey.legs[lastLegIndex].destination.name,
            //duration: journey.legs[0].duration,
            depart: {
                planned: moment(journey.legs[0].origin.departureTimePlanned),
                estimated: moment(journey.legs[0].origin.departureTimeEstimated)
            },
            arrival: {
                planned: moment(journey.legs[lastLegIndex].destination.departureTimePlanned),
                estimated: moment(journey.legs[lastLegIndex].destination.departureTimeEstimated)
            }
        };
        let totalDuration = 0;
        journey.legs.forEach(item => {
            totalDuration += item.duration;
        })
        train.duration = totalDuration;
        let stops = [];
        journey.legs.forEach(item => {
            item.stopSequence.forEach(stop => {
                stops.push({
                    name: stop.name.split(", ")[1], 
                    time: {planned: moment(stop.departureTimePlanned), estimated: moment(stop.departureTimeEstimated)}
                });
            })
        })
        stops = stops.filter(item => item.time.planned !== undefined);
        train.stops = stops;
        train.fare = {};
        journey.fare.tickets.forEach(item => {
            train.fare[item.person] = item.priceBrutto;
        })
        trains.push(train);
    }
    return trains;
}



module.exports = parseJourneys;