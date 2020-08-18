//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import fs from "fs";
import {ReadAwaitingInput, WriteAwaitingInput, ReadPrefix} from './Bot.mjs';
import {RemoveFromAwaitingInput} from './AwaitingInput.mjs';
import {ParseMsgObj, TourneyJSON, CheckIfOnlyNum, CheckEvenNum, RemoveSpecialChars} from './Helpers.mjs';

export function CreateTourneyPrompt(MsgObj) { // First prompt, asks for name.
    let i = 0;
    if (TourneyJSON().Tourneys.length != 0) { // Fails if there's already a tournament running.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, ya hay un torneo en curso!!")
        RemoveFromAwaitingInput(MsgObj);
        return;
    }
    else {
        MsgObj.channel.send('Torneo en camino! Cómo se va a llamar? (Máximo 26 caracteres) *(Para cancelar el comando: "' + ReadPrefix() + ' cancelar")*')
        let AwaitingInput = ReadAwaitingInput();
        for (i in AwaitingInput) {
            if (AwaitingInput[i].User == MsgObj.author.id) {
                AwaitingInput[i].State = 1;
                WriteAwaitingInput(AwaitingInput);
                return;
            }
        }
    }
}

export function CreateTourneyName(MsgObj) { // Saves name and asks for size.
    let i = 0;
    let Name;
    if (ParseMsgObj(MsgObj, true) == "cancelar") {
        MsgObj.channel.send("Cancelado.");
        RemoveFromAwaitingInput(MsgObj);
        return; // Cancels all and exits.
    }
    else {
        if (ParseMsgObj(MsgObj, false).length > 26) {
            MsgObj.channel.send("<@" + MsgObj.author.id + ">, el nombre del torneo no puede exceder los 26 caracteres! Intenta con otro más corto.");
            return;
        }
        if (RemoveSpecialChars(ParseMsgObj(MsgObj, false), true).length != ParseMsgObj(MsgObj, false).length) {
            MsgObj.channel.send("<@" + MsgObj.author.id + ">, el nombre del torneo no puede contener caracteres especiales! Intenta con otro.");
            return;
        }
        let AwaitingInput = ReadAwaitingInput();
        for (i in AwaitingInput) {
            if (AwaitingInput[i].User == MsgObj.author.id) {
                AwaitingInput[i].SavedData = ParseMsgObj(MsgObj, false);
                AwaitingInput[i].State = 2;
                WriteAwaitingInput(AwaitingInput);
                Name = ParseMsgObj(MsgObj, false);
            }
        }
        MsgObj.channel.send('El nombre del torneo será "' + Name + '". Cuántos participantes habrán? (Mínimo 8) *(Para cancelar el comando: "' + ReadPrefix() + ' cancelar")*');
        return;
    }
}

export function CreateTourneySize(MsgObj) { // Receives size and opens tournament for enrollment.
    let i = 0;
    let Size;
    if (ParseMsgObj(MsgObj, true) == "cancelar") {
        MsgObj.channel.send("Cancelado.");
        RemoveFromAwaitingInput(MsgObj);
        return; // Cancels all and exits.
    }
    else {
        let AwaitingInput = ReadAwaitingInput();
        for (i in AwaitingInput) {

            if (AwaitingInput[i].User == MsgObj.author.id) {
                
                if (CheckIfOnlyNum(ParseMsgObj(MsgObj, false))) { // Only numbers are allowed.

                    if (ParseMsgObj(MsgObj, false) > 7) { // Numbers greater than 7.

                        if (CheckEvenNum(parseInt(ParseMsgObj(MsgObj, false)))) {
                            
                            Size = parseInt(ParseMsgObj(MsgObj, false));
                            let file = TourneyJSON();

                            let Tourney = {
                                Name: AwaitingInput[i].SavedData,
                                Creator: MsgObj.author.id, // Important for admin-like stuff.
                                Size: Size, 
                                AdminPoints: true,
                                Active: false, // People can join while tournament is not active.
                                Participants: [],
                                InPrelims: true,
                                Prelims: [],
                                PrelimsPoints: [],
                                Brackets: [],
                                BracketsPoints: []
                            };

                            file.Tourneys.push(Tourney);
                            fs.writeFileSync("Tourney.json", JSON.stringify(file));
                            MsgObj.channel.send('Torneo "' + AwaitingInput[i].SavedData + '" creado correctamente! Usen "' + ReadPrefix() + ' join" para empezar a picarla!')
                            AwaitingInput.splice(i, 1);
                            WriteAwaitingInput(AwaitingInput);
                            return; // Writes tournament and exits.
                        }
                        else {
                            MsgObj.channel.send("<@" + MsgObj.author.id + ">, el número debe ser par, para que todos puedan jugar todos los partidos!");
                            return;
                        }
                    }
                    else {
                        MsgObj.channel.send("<@" + MsgObj.author.id + ">, por favor ingresa un número válido!");
                        return;
                    }
                }
                else {
                    MsgObj.channel.send("<@" + MsgObj.author.id + ">, solo se pueden entrar valores numéricos!");
                    return;
                }
            }
        }        
    }
}


