//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import fs from "fs";
import {ReadPrefix, ReadBot} from './Bot.mjs';

//---------------------------------------------//
// Helper functions.
//---------------------------------------------//

export function ParseMsgObj(MsgObj, toLower) { // Strips the message content from the prefix + the space.
    if (toLower) {
        return (MsgObj.content.slice(ReadPrefix().length + 1)).toLowerCase();
    }
    else {
        return MsgObj.content.slice(ReadPrefix().length + 1);
    }
}

//---------------------------------------------//

export function RandomNum(Min, Max) { // Vanilla random.
    return Math.floor(Math.random() * (Max - Min) + Min);
}

//---------------------------------------------//

export function TourneyJSON() { // Shortcut for the Tourney.json.
    return JSON.parse(fs.readFileSync("Tourney.json", {encoding: "utf8"}));
}

//---------------------------------------------//

export function RemoveSpecialChars(String, AllowSpaces) { // Simple regex to remove non-alphanumeric characters from string.
    if (AllowSpaces) {
        return String.replace(/[^a-zA-Z0-9 ]/g, ''); //Includes spaces in the allowed characters.
    }
    return String.replace(/[^a-zA-Z0-9]/g, '');
}

//---------------------------------------------//

export function CheckIfOnlyNum(Str) { // Checks that every character in a string is a number.
    let i = 0;
    let arr = Array.from(String(Str))
    for (i in arr) {
        if (arr[i] === "0" || arr[i] === "1" || arr[i] === "2" || arr[i] === "3" || arr[i] === "4" || arr[i] === "5" || arr[i] === "6" || arr[i] === "7" || arr[i] === "8" || arr[i] === "9") {
           continue;
        }
        else {
            return false;
        }
    }
    return true;
}

//---------------------------------------------//

export function CheckEvenNum(Int) { // Checks that an int ends with an even number.
    let arr = Array.from(String(Int));
    let num = arr[arr.length - 1];
    if (num == 0 || num == 2 || num == 4 || num == 6 || num == 8) {
        return true;
    }
    return false;
}

//---------------------------------------------//

export function SkipFirstSpace(String) { // Allows commands to have a little more freedom by disregarding 
    let i = 0;
    for (i in Array.from(String)) {
        if (Array.from(String)[i] == " ") {
            continue;
        }
        String = String.slice(i);
        return String;
    }
}

//---------------------------------------------//

export function SliceFromFirstSpace(String) { // Reads all the content, beginning from the first space.
    let i = 0;
    let NewString = "";
    for (i in Array.from(String)) {
        if (Array.from(String)[i] == " ") {
            break;
        }
        NewString = NewString + Array.from(String)[i];
    }
    return NewString;
}

//---------------------------------------------//

export function GetFirstNumber(String) { // Gets the first number.
    let i = 0;
    let NewString = "";
    for (i in Array.from(String)) {
        if (CheckIfOnlyNum(Array.from(String)[i])) {
            NewString = NewString + Array.from(String)[i];
            continue;
        }
        break;
    }
    return NewString;
}

//---------------------------------------------//

export function ShuffleArray(array) { // Randomizes the entries inside an array.
    let shuffled = array
    .map((a) => ({sort: Math.random(), value: a}))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
    return shuffled;
}

//---------------------------------------------//

export function RandomGoodLuck() { // Flavor added when successfully joining a tournament.
    let file = JSON.parse(fs.readFileSync("GoodLuck.json", {encoding: "utf8"}));
    return file.Phrases[RandomNum(0, file.Phrases.length)];
}

//---------------------------------------------//

export function RandomPointsPhrase() { // Flavor added when requesting points.
    let file = JSON.parse(fs.readFileSync("PointsPhrases.json", {encoding: "utf8"}));
    return file.Phrases[RandomNum(0, file.Phrases.length)];
}

//---------------------------------------------//

export async function FetchParticipantByNickname(Nickname) { // Fetches user object by reading participant nickname.
    let i = 0;
    let Participants = TourneyJSON().Tourneys[0].Participants;
    let id;

    for (i in Participants) {
        if (Nickname == Participants[i].Nickname) {
            id = Participants[i].ID
            break;
        }
    }
    
    let User = await (ReadBot().fetchUser(id))
    return User;
}

//---------------------------------------------//

export function FindPairOpponentIndex(IndexInput) { // Opposing player in the same pair.
    let OpponentIndex;

    if (CheckEvenNum(IndexInput)) {
        OpponentIndex = +IndexInput + +1
    }
    else {
        OpponentIndex = IndexInput - 1
    }

    return OpponentIndex;
}

//---------------------------------------------//

export function FindBracketPlayersIndex(IndexInput) { // Translates a long array of pairs into the organized
    let ArrayIndex;                                   // ways of Brackets[] at Tourney.json.
    let PlayerIndex;
    let OpponentIndex;

    if (IndexInput < 14) {
        ArrayIndex = 2
        PlayerIndex = IndexInput - 12
    }
    if (IndexInput < 12) {
        ArrayIndex = 1
        PlayerIndex = IndexInput - 8
    }
    if (IndexInput < 8) {
        ArrayIndex = 0
        PlayerIndex = IndexInput
    }

    if (CheckEvenNum(IndexInput)) {
        OpponentIndex = PlayerIndex + 1
    }
    else {
        OpponentIndex = PlayerIndex - 1
    }

    return [PlayerIndex, OpponentIndex, ArrayIndex];
}

//---------------------------------------------//

export function CommandName(Event) { // Human readable way to refer to a function when requesting an event while having
    switch(Event) {           // a non finished event already awaiting for a response.
        case ChangePrefixRedir:
            return '"cambio de prefijo"';
        case CreateTourneyRedir:
            return '"creación de torneo"';
        case SendMsg:
            return '"SendMsg"';
        case JoinTourneyRedir:
            return '"unirse a torneo"';
    }
    return;
}

//---------------------------------------------//