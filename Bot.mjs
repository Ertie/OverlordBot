//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

'use strict';

import Discord from 'discord.js';
import fs from "fs";
import {ParseMsgObj} from './Helpers.mjs';
import {AssignPoints, BracketPoints} from './AssignPoints.mjs';
import {CheckAwaitingInput} from './AwaitingInput.mjs';
import {ChangePrefixRedir, CreateTourneyRedir, JoinTourneyRedir, DeleteTourneyRedir} from './Redirectors.mjs';
import {SetAdminPoints} from './TourneyActions.mjs';
import {BeginTourney, BeginBrackets} from './BeginTourney.mjs';
import {ShowCommands} from './RichEmbed.mjs';

const bot = new Discord.Client();
const token = JSON.parse(fs.readFileSync("Token.json", {encoding: "utf8"})).bots[1].token;

// For reading bot info from outside.
export function ReadBot() {
    return bot;
}

// Prefix and the tools to read and write from outside.
var Prefix = JSON.parse(fs.readFileSync("Info.json", {encoding: "utf8"})).Prefix;

export function ReadPrefix() {
    return Prefix;
}
export function WritePrefix(Data) {
    Prefix = Data;
    return;
}

// AwaitingInput variable and the tools to read and write from outside.
var AwaitingInput = [];

export function ReadAwaitingInput() {
    return AwaitingInput;
}
export function WriteAwaitingInput(Data) {
    AwaitingInput = Data;
    return;
}

//---------------------------------------------//
// The command checks parse the message in some way to then advance to the next step in redirecting
// the user to the corresponding event they're looking for.
//---------------------------------------------//

function CheckCommand(MsgObj) { // First line of defense for reading commands after having the prefix called.
    let MsgParsed = ParseMsgObj(MsgObj, true);
    switch (MsgParsed) {
        default:
            CheckCommand2(MsgObj); // Other commands have different syntax than a plain "case".
            break;
        case "changeprefix":
            CheckAwaitingInput(MsgObj, ChangePrefixRedir);
            break;
        case "createtourney":
            CheckAwaitingInput(MsgObj, CreateTourneyRedir);
            break;
        case "deletetourney":
            CheckAwaitingInput(MsgObj, DeleteTourneyRedir);
            break;
        case "join":
            CheckAwaitingInput(MsgObj, JoinTourneyRedir);
            break;
        case "begintourney":
            BeginTourney(MsgObj);
            break;
        case "beginbrackets":
            BeginBrackets(MsgObj);
            break;
        case "help":
            ShowCommands(MsgObj);
            break;
    }
    return;
}

function CheckCommand2(MsgObj) { // If none of the other commands have triggered, it will look here.
    let MsgParsed = ParseMsgObj(MsgObj, true);
    let i = 0;

    if (MsgParsed.startsWith("day")) {
        console.log("day command");
        AssignPoints(MsgObj, "day");
        return;
    }

    if (MsgParsed.startsWith("reset") || MsgParsed.startsWith("clear")) {
        console.log("reset command");
        AssignPoints(MsgObj, "reset");
        return;
    }

    if (MsgParsed.startsWith("points")) {
        BracketPoints(MsgObj);
        return;
    }

    if (MsgParsed.startsWith("adminpoints")) {
        SetAdminPoints(MsgObj);
        return;
    }

    for (i in AwaitingInput) {
        if (AwaitingInput[i].User == MsgObj.author.id) {
            AwaitingInput[i].Event.bind(null, MsgObj, AwaitingInput[i].State)();
            return;
        }
    }
    MsgObj.channel.send("<@" + MsgObj.author.id + ">, eso no es un comando válido. '*" + Prefix + " help*' para una lista de comandos.");
    return; // When absolutely no valid command has happened, returns help command reminder.
}

//---------------------------------------------//
//---------------------------------------------//
//---------------------------------------------//

bot.on('message', async message => // Runs for every message received.
{
    if (message.author.bot) // It's very important not to take into account bot messages.
    {
        return;
    }
    if (message.channel.type == "dm") {
        message.author.send("Bue qué saltás, caucho. Te vendí una batería de scooter hace 3 años por favor ya no sé cómo pedirtelo borrá mi número.");
        return;
    }
    if (message.content.startsWith(Prefix) == true) { // If the prefix has been used.
        if (message.content.length == Prefix.length){ // Just the prefix.
            message.channel.send("THAT'S ME");
        }
        else {
            if (Array.from(message.content)[Prefix.length] == " ") { // Prefix + something else.
                CheckCommand(message);
            }
            else {
                message.channel.send('Los comandos necesitan un espacio luego del prefijo *("' + Prefix + ' ...")*.'); //Started with prefix but didn't continue with space.
            }
        }
    }
    else {
        // Nothing was recognized.
        return;
    }
});

bot.on('ready', async () =>
{
    console.log('I am ready!');
});

bot.login(token); // Login function, uses credentials from .json.