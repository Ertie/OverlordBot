//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import fs from "fs";
import {TourneyJSON, ShuffleArray} from './Helpers.mjs';
import {SortByPoints} from './TourneyActions.mjs';

//---------------------------------------------//
// Tourney creator can begin it, which sets the tournament to active, closes further enrollment,
// and starts the prelims arranging algorithm.
//---------------------------------------------//

export function BeginTourney(MsgObj) {

    if (TourneyJSON().Tourneys.length == 0) { // If no tournament is found.
        MsgObj.channel.send("No hay ningún torneo pendiente a comenzar.");
        return;
    }

    if (TourneyJSON().Tourneys[0].Active) {
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, el torneo ya está en curso!")
        return;
    }

    if (TourneyJSON().Tourneys[0].Creator =! MsgObj.author.id) { // If the creator is trying to start the tourney.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, solo el creador del torneo puede comenzarlo.");
        return;
    }

    if (TourneyJSON().Tourneys[0].Participants.length < 8) {
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, se requiere un mínimo de 8 personas para comenzar el torneo!");
        return;
    }

    let file = TourneyJSON();
    file.Tourneys[0].Active = true;
    let SizeLeft = (parseInt(TourneyJSON().Tourneys[0].Size) - (TourneyJSON().Tourneys[0].Participants.length));
    // SizeLeft contains the amount of participants that can still join.
    let AppendMsg;

    if (SizeLeft == 0) {
        AppendMsg = "";
    }
    else {
        AppendMsg = "Inscripciones cerradas. "; // Simple detail in the final message.
    }
    console.log("BEGIN TOURNEY.");

    fs.writeFileSync("Tourney.json", JSON.stringify(file));
    SortGameDays(); // Arranges the prelim days.
    MsgObj.channel.send('"' + TourneyJSON().Tourneys[0].Name + '" comenzó! ' + AppendMsg + "Suerte para todos.");
    return; // Tournament is open and everyone can start playing their matches.
}

//---------------------------------------------//
// SortGameDays() handles all the processes related to creating the preliminary matchups.
//---------------------------------------------//

function SortGameDays() {
    let file = TourneyJSON();
    let Participants = file.Tourneys[0].Participants;
    let i = 0;
    let j = 1; // SortGameDaysLoop() will add pairs with j being offset 1 as the second participant.
    let k = 0;
    let l = 0;
    let Pairs = []; // Raw pairs go here.
    let TempNames = []; // Easy reading.
    let Prelims = []; // Final array of preliminary games.
    let PrelimsPoints = [];

//---------------------------------------------//
// SortGameDaysLoop() adds participants in pairs with no duplicates, by
// offsetting 1 i each full loop of participants.
//---------------------------------------------//

    function SortGameDaysLoop(i, j) {
        if (i == Participants.length - 1) {
            return;
        }
        else {
            if (j == Participants.length) {
                i++;
                j = i + 1;
                SortGameDaysLoop(i, j);
            }
            else {
                Pairs.push([Participants[i].Nickname, Participants[j].Nickname]);
                j++;
                SortGameDaysLoop(i, j);
            }
        }
    }

//---------------------------------------------//
// SetGameDaysLoop() sets the preliminary groups to have (Participants - 1) amount of days, with
// (Participants / 2) amount of matches per day. Also, makes sure no day has a duplicate individual
// participant, so that theoretically everyone can have their game at the same time each day.
//---------------------------------------------//

    function SetGameDaysLoop(i, j, k, l) {
        if (i == Participants.length - 1) {  // i represents full days

            Prelims = Prelims.map(ShuffleArray); // When done, shuffles matches in a day,
            Prelims = ShuffleArray(Prelims); // and days in the prelims.

            file.Tourneys[0].Prelims = Prelims;
            file.Tourneys[0].PrelimsPoints = PrelimsPoints;
            fs.writeFileSync("Tourney.json", JSON.stringify(file));
            return; // Writes new prelims and exits.
        }
        else {
            if (j == Participants.length / 2) { // j represents matches in a day
                i++;
                j = 0;
                k = 0;
                TempNames = []; // Reset local search for hits.
                SetGameDaysLoop(i, j, k, l);
            }
            else {
                if (k == Pairs.length) { // k runs through all the raw pairs on a loop
                    k = 0;
                }
                if (Pairs[k] != undefined) { // To not mess with the index, used pairs are set to undefined.

                    if (l == TempNames.length) { // l checks the current day for duplicates. Not finding a
                        l = 0;                   // duplicate in all the entries logically means safe addition. 

                        TempNames.push(Pairs[k][0], Pairs[k][1]); // Same as Prelims[i], but scatters them without
                        if (Prelims[i] == undefined) {            // needing to open another [].

                            Prelims.push([]); // First loop on every i creates the [] entry in Prelims.
                            PrelimsPoints.push([]);
                        }
                        Prelims[i].push(Pairs[k]);
                        PrelimsPoints[i].push([0, 0]);
                        delete Pairs[k]; // Used pair.
                        j++;
                        SetGameDaysLoop(i, j, k, l);
                    }
                    else {
                        if (TempNames[l] == Pairs[k][0] || TempNames[l] == Pairs[k][1]) { // Any hit is unacceptable.
                            k++; // Search next pair.
                            l = 0; // Everything needs to be checked again.
                            SetGameDaysLoop(i, j, k, l);
                        }
                        else {
                            l++; // Check next participant.
                            SetGameDaysLoop(i, j, k, l);
                        }
                    }
                }
                else { // Undefined entry is no good.
                    k++;
                    SetGameDaysLoop(i, j, k, l);
                }
            }
        }
    }
    SortGameDaysLoop(i, j);
    i = 0; // Reset values for new loop.
    j = 0;
    k = 0;
    l = 0;
    SetGameDaysLoop(i, j, k, l);
    return;
}

//---------------------------------------------//
// Finishes the preliminary phase, and begins eliminatory phase.
//---------------------------------------------//

export function BeginBrackets(MsgObj) {

    let i = 0;
    let k = 0;
    let file = TourneyJSON();
    let PrelimsPoints;
    let Participants = file.Tourneys[0].Participants;

    function AllPrelimsPlayed() { // Checks that all prelims are finished before going on.

        PrelimsPoints = TourneyJSON().Tourneys[0].PrelimsPoints;

        if (PrelimsPoints.length > 0) {
            for (i in PrelimsPoints) {
                for (k in PrelimsPoints[i]) {
                    if (PrelimsPoints[i][k][0] == 0 && PrelimsPoints[i][k][1] == 0) {
                        return false;
                    }
                }
            }
            return true;
        }
        return false;
    }
    

    if (TourneyJSON().Tourneys.length == 0) { // If no tournament is found.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no existe ningún torneo!");
        return;
    }

    if (file.Tourneys[0].Active == false) { // In case the tournament hadn't started yet.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, éste torneo todavía no comenzó su fase preliminar!");
        return;
    }
    
    if (file.Tourneys[0].InPrelims == false) { // In case the tournament is already in brackets phase.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, el torneo ya se encuentra en la fase de grupos!");
        return;
    }

    if (file.Tourneys[0].Creator != MsgObj.author.id) { // Only creator can do this.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, solo el creador del torneo puede comenzar la fase de grupos!");
        return;
    }

    if (AllPrelimsPlayed()) {
    }
    else {
        MsgObj.channel.send("Es necesario terminar todos los partidos de las fases preliminares antes de comenzar la fase eliminatoria!")
        return;
    }
    
    let Sorted = SortByPoints();
    // First goes against last, and so on.
    let Brackets = [[0, 7, 1, 6, 2, 5, 3, 4],[null, null, null, null],[null, null],[null]];
    let BracketsPoints = [[0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0], [0, 0]];
    i = 0;

    // Players sorted by points are then pulled in order, by the values in Brackets[].
    for (i in Brackets[0]) {
        Brackets[0][i] = Participants[Sorted[1][Brackets[0][i]]].Nickname;
    }

    file.Tourneys[0].Brackets = Brackets;
    file.Tourneys[0].BracketsPoints = BracketsPoints;
    file.Tourneys[0].InPrelims = false;

    fs.writeFileSync("Tourney.json", JSON.stringify(file));
    MsgObj.channel.send("Comenzó la fase de grupos! Suerte para todos! Aunque pensándolo bien... solo puede ganar uno.");
    return;
}