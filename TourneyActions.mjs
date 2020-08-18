//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import fs from "fs";
import {ReadAwaitingInput, WriteAwaitingInput, ReadPrefix} from './Bot.mjs';
import {RemoveFromAwaitingInput} from './AwaitingInput.mjs';
import {ParseMsgObj, TourneyJSON} from './Helpers.mjs';
import {SortInts} from './Sort.mjs';

export function DeleteTourneyPrompt (MsgObj) { // First prompt that asks for confirmation.
    let i = 0;

    if (TourneyJSON().Tourneys.length == 0) { // If no tournament is found.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no existe ningún torneo!");
        RemoveFromAwaitingInput(MsgObj);
        return;
    }

    if (TourneyJSON().Tourneys[0].Creator != MsgObj.author.id) { // Only the creator can delete a tournament.
        MsgObj.channel.send("Solo el creador del torneo puede eliminarlo!");
        RemoveFromAwaitingInput(MsgObj);
        return;
    }

    MsgObj.channel.send('Estás seguro de querer borrar "' + TourneyJSON().Tourneys[0].Name + '"? *Escribe "' + ReadPrefix() + ' si" para borrarlo, y "' + ReadPrefix() + ' cancelar" para olvidar éste sacrilegio.*');
    let AwaitingInput = ReadAwaitingInput();
    for (i in AwaitingInput) {
        if (AwaitingInput[i].User == MsgObj.author.id) {
            AwaitingInput[i].State = 1;
            WriteAwaitingInput(AwaitingInput);
            return;
        }
    }
}

export function DeleteTourneyResolve(MsgObj) { // Takes in the response and resolves accordingly.
    let i = 0;

    if (ParseMsgObj(MsgObj, true) == "si") {
        let file = TourneyJSON();
        let Name = file.Tourneys[0].Name;
        file.Tourneys.splice(0, 1);
        fs.writeFileSync("Tourney.json", JSON.stringify(file));
        MsgObj.channel.send('Torneo "' + Name + '" eliminado correctamente!');
        RemoveFromAwaitingInput(MsgObj);
        return; // Deletes tournament data and exits.
    }
    else {
        if (ParseMsgObj(MsgObj, true) == "cancelar") {
            MsgObj.channel.send("Cancelado.");
            RemoveFromAwaitingInput(MsgObj);
            return; // Cancels all and exits.
        }
        return;
    }
}

//---------------------------------------------//

export function SetAdminPoints(MsgObj) { // Sets the AdminPoints value at the tournament JSON.
    let MsgParsed = ParseMsgObj(MsgObj, false);
    MsgParsed = MsgParsed.slice(11); // 11 is just the length of "adminpoints".
    let file = TourneyJSON();

    if (TourneyJSON().Tourneys.length == 0) { // If no tournament is found.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no existe ningún torneo!");
        return;
    }

    if (file.Tourneys[0].Creator != MsgObj.author.id) { // Only the tourney creator can set the AdminPoints value.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, solo el creador del torneo puede cambiar ésta configuración.");
        return;
    }

    if (MsgParsed.length == 0) { // If the user only said "adminpoints" with no extra input. Receives instructions.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, agrega 0 o 1 al comando para desactivar o activar que solo el creador pueda asignar los puntos del torneo.");
        return;
    }

    if (MsgParsed == 0 || MsgParsed == "off") { // Deactivates admin points.
        file.Tourneys[0].AdminPoints = false;
        fs.writeFileSync("Tourney.json", JSON.stringify(file));
        MsgObj.channel.send("De ahora en más, cualquier participante puede asignar puntos. No lo arruinen.");
        return;
    }

    if (MsgParsed == 1 || MsgParsed == "on") { // Activates admin points.
        file.Tourneys[0].AdminPoints = true;
        fs.writeFileSync("Tourney.json", JSON.stringify(file));
        MsgObj.channel.send("De ahora en más, solo el creador del torneo puede asignar puntos.");
        return;
    }
    
    // Fails if the user does not input 0 or 1.
    MsgObj.channel.send("<@" + MsgObj.author.id + ">, ese no es un valor válido.");
    return;
}

export function SortByPoints() { // Sorts participants in by their points from the prelims.
    let Participants = TourneyJSON().Tourneys[0].Participants;
    let PointsArr = [];
    let i = 0;

    for (i in Participants) {
        PointsArr.push(Participants[i].Points);
    }

    return SortInts(PointsArr, false);
}