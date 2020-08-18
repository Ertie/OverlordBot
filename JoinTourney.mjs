//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import fs from "fs";
import {ReadAwaitingInput, WriteAwaitingInput, ReadPrefix} from './Bot.mjs';
import {RemoveFromAwaitingInput} from './AwaitingInput.mjs';
import {ParseMsgObj, TourneyJSON, RemoveSpecialChars, RandomGoodLuck} from './Helpers.mjs';

export function JoinTourneyPrompt(MsgObj) { // First prompt that asks for name.
    let i = 0;
    let PluralPlayer;

    if (TourneyJSON().Tourneys.length == 1) { // If there's an open tournament.
        let SizeLeft = (parseInt(TourneyJSON().Tourneys[0].Size) - (TourneyJSON().Tourneys[0].Participants.length));
        // SizeLeft contains the amount of participants that can still join.

        if (SizeLeft == 1) { // Word detail at the first message.
            PluralPlayer = "jugador";
        }
        else {
            PluralPlayer = "jugadores";
        }

        if (TourneyJSON().Tourneys[0].Active) { // Cannot join an already running tournament.
            MsgObj.channel.send('Lo siento, pero "' + TourneyJSON().Tourneys[0].Name + '" ya está en curso!! Espera al siguiente.');
            RemoveFromAwaitingInput(MsgObj);
            return;
        }

        if (SizeLeft == 0) { // Cannot join a full tournament.
            MsgObj.channel.send('Lo siento, pero "' + TourneyJSON().Tourneys[0].Name + '" ya está lleno! Espera al siguiente.');
            RemoveFromAwaitingInput(MsgObj);
            return;
        }

        let AwaitingInput = ReadAwaitingInput();

        for (i in TourneyJSON().Tourneys[0].Participants) {
            if (TourneyJSON().Tourneys[0].Participants[i].ID == MsgObj.author.id) { // Cannot join a tournament twice.
                MsgObj.channel.send('Ya estabas inscripto en éste torneo como "' + TourneyJSON().Tourneys[0].Participants[i].Nickname + '"! Nos vemos en el campo de batalla.');
                AwaitingInput.splice(i, 1);
                WriteAwaitingInput(AwaitingInput);
                return;
            }
        }
        i = 0;

        MsgObj.channel.send('"' + TourneyJSON().Tourneys[0].Name + '" todavía está esperando ' + SizeLeft + ' ' + PluralPlayer + '! Con qué nombre te anoto? *(Para cancelar el comando: "' + ReadPrefix() + ' cancelar")*')
        for (i in AwaitingInput) {
            if (AwaitingInput[i].User == MsgObj.author.id) {
                AwaitingInput[i].State = 1
                WriteAwaitingInput(AwaitingInput);
                return;
            }
        }
    }
    else {
        MsgObj.channel.send("Lo siento, no hay ningún torneo activo!");
        RemoveFromAwaitingInput(MsgObj);
        return; // Cancels all and exits.
    }
}

export function JoinTourneyName(MsgObj) {
    let i = 0;
    let Tourney = TourneyJSON();

    if (TourneyJSON().Tourneys.length == 1) { // If the tournament wasn't deleted in the middle of the sign-up.

        if (ParseMsgObj(MsgObj, true) == "cancelar") {
            MsgObj.channel.send("Cancelado.");
            RemoveFromAwaitingInput(MsgObj);
            return; // Cancels all and exits.
        }

        else {
            if (TourneyJSON().Tourneys[0].Active) { // If the tournament didn't close in the middle of the sign-up.
                MsgObj.channel.send("Parece que éste torneo ya está en curso... mala suerte, friend.");
                RemoveFromAwaitingInput(MsgObj);
                return;
            }

            if (ParseMsgObj(MsgObj, false).length > 11) { // Too long of a name.
                MsgObj.channel.send("<@" + MsgObj.author.id + ">, no se permiten más de 11 caracteres para un nombre! Intenta con otro.");
                return;
            }

            if (RemoveSpecialChars(ParseMsgObj(MsgObj, false)).length == ParseMsgObj(MsgObj, false).length) {
                // Checks that the message doesn't contain spaces or special characters.
                for (i in Tourney.Tourneys[0].Participants) {
                    if (ParseMsgObj(MsgObj, true) == Tourney.Tourneys[0].Participants[i].Nickname.toLowerCase()) {
                        MsgObj.channel.send('Ya hay alguien anotado con el nombre "' + Tourney.Tourneys[0].Participants[i].Nickname + '". Por favor, ingresa un nombre distinto.');
                        return; // Can't use an already used nickname.
                    }
                }
                i = 0;

                Tourney.Tourneys[0].Participants.push({ // Pushes entry for the new player.
                    ID: MsgObj.author.id,
                    AvatarID: MsgObj.author.avatar,
                    Nickname: ParseMsgObj(MsgObj, false),
                    Points: 0,
                    GamesPlayed: 0,
                    GamesWon: 0,
                    GamesLost: 0
                })
                
                fs.writeFileSync("Tourney.json", JSON.stringify(Tourney));
                console.log("pushed " + ParseMsgObj(MsgObj, false))
                RemoveFromAwaitingInput(MsgObj);
                MsgObj.channel.send('Te inscribiste correctamente en "' + TourneyJSON().Tourneys[0].Name + '"!! ' + RandomGoodLuck());
                return; // Player is enrolled in tournament. Exits all.
            }
            else {
                MsgObj.channel.send("<@" + MsgObj.author.id + ">, no se permiten espacios ni caracteres especiales en el nickname!");
                return;
            }            
        }

    }
    else {
        MsgObj.channel.send("Lo siento, no hay ningún torneo activo!");
        return;
    }
}