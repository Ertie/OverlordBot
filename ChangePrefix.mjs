//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import fs from "fs";
import {ReadAwaitingInput, WriteAwaitingInput, ReadPrefix, WritePrefix} from './Bot.mjs';
import {RemoveFromAwaitingInput} from './AwaitingInput.mjs';
import {ParseMsgObj} from './Helpers.mjs';

export function ChangePrefixPrompt(MsgObj) { // First prompt that explains how to change the prefix.
    let i = 0;
    let AwaitingInput = ReadAwaitingInput();
    MsgObj.channel.send('Estas queriendo cambiar el prefijo, ingresa "' + ReadPrefix() + '", junto con un espacio y el nuevo prefijo.');
    for (i in AwaitingInput) {
        if (AwaitingInput[i].User == MsgObj.author.id) {
            AwaitingInput[i].State = 1;
            WriteAwaitingInput(AwaitingInput);
            return;
        }
    }
    return;
}

export function ChangePrefixReceive(MsgObj) { // Saves the prefix in SavedData for setting when confirmation is given.
    let i = 0;

    if (ParseMsgObj(MsgObj, false) > 12){
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, el prefijo no puede tener más de 12 caracteres!")
        return;
    }

    let AwaitingInput = ReadAwaitingInput();
    MsgObj.channel.send('<@' + MsgObj.author.id + '>, recibí el nuevo prefijo "' + ParseMsgObj(MsgObj, false) + '". Es correcto? (Ingresa "' + ReadPrefix() + '" + si/cancelar)');

    for (i in AwaitingInput) {
        if (AwaitingInput[i].User == MsgObj.author.id) {
            AwaitingInput[i].State = 2;
            AwaitingInput[i].SavedData = ParseMsgObj(MsgObj, false);
            WriteAwaitingInput(AwaitingInput);
            return;
        }
    }
    return;
}

export function ChangePrefixResolve(MsgObj) { // Takes a "do" or "don't" and resolves accordingly.
    let i = 0;
    let AwaitingInput = ReadAwaitingInput();
    if (MsgObj.content == ReadPrefix() + " si") {
        for (i in AwaitingInput) {
            if (AwaitingInput[i].User == MsgObj.author.id) {
                WritePrefix(AwaitingInput[i].SavedData);
                let file = JSON.parse(fs.readFileSync("Info.json", {encoding: "utf8"}));
                file.Prefix = ReadPrefix();
                fs.writeFileSync("Info.json", JSON.stringify(file));
                AwaitingInput.splice(i, 1)
                WriteAwaitingInput(AwaitingInput);
                MsgObj.channel.send('El nuevo prefijo es "' + ReadPrefix() + '"!');
                return; // Writes new prefix and exits.
            }
        }
    }
    if (MsgObj.content == ReadPrefix() + " cancelar") {
        MsgObj.channel.send("Cancelado.");
        RemoveFromAwaitingInput(MsgObj);
        return; // Cancels all and exits.
    }
    return;
}