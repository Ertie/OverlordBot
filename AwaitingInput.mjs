//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import {ReadAwaitingInput, WriteAwaitingInput} from './Bot.mjs';
import {ChangePrefixRedir, CreateTourneyRedir, JoinTourneyRedir, DeleteTourneyRedir} from './Redirectors.mjs';

//---------------------------------------------//
// CheckAwaitingInput() puts a user in the AwaitingInput[] "buffer" if they're not already running a
// multi-prompt command with the bot. It will then keep track of the state of the command, redirect to
// the corresponding command when called, and prompt for completion of a previous command if needed.
// This is also important because it allows the bot to keep conversation with each user separately,
// disallowing anyone else to complete your prompts on your name and allowing for a better flow.
// This buffer is cleared when a command is cancelled or finished.
//---------------------------------------------//

export function CheckAwaitingInput(MsgObj, ExtraFunction){
    let i = 0;
    let AwaitingInput = ReadAwaitingInput();
    function PushNewInput() { // Function that creates an entry at AwaitingInput[].
        AwaitingInput.push({
            User: MsgObj.author.id,
            MsgObj: MsgObj,
            Event: ExtraFunction, // Every time a multi-prompt is called, it will be checked against this one first.
            State: 0,
            SavedData: undefined // SavedData is handy to remember stuff between prompts.
        });
        WriteAwaitingInput(AwaitingInput);
    }
    if (AwaitingInput.length == 0) { // First timer in the buffer.
        PushNewInput();
        (AwaitingInput[0].Event).bind(null, MsgObj, 0)(); // Redirects to the function as State 0.
    }
    else {
        for (i in AwaitingInput) { // Searches the buffer for the existance of the current user.
            if (AwaitingInput[i].User == MsgObj.author.id) { // Entry found.
                console.log("Already waiting an input from " + MsgObj.author.id);
                if (AwaitingInput[i].Event == ExtraFunction) { // Heads-up in the log if the user just inputted the same function.
                    (AwaitingInput[i].Event).bind(null, MsgObj, AwaitingInput[i].State)(); // Continues as normal.
                    console.log("Same function");                    
                    return;
                }
                else {
                    console.log("Different function");
                    MsgObj.channel.send("Estas queriendo comenzar otro comando, pero todavía estoy esperando respuesta de " + CommandName(AwaitingInput[i].Event) + ".");
                    return; // Alerts the user that they still have business over at a different command they started.
                }
            }
        }
        PushNewInput(); // If the user wasn't found.
        (AwaitingInput[AwaitingInput.length - 1].Event).bind(null, MsgObj, AwaitingInput[AwaitingInput.length - 1].State)();
        return;
    }
};

export function RemoveFromAwaitingInput(MsgObj) { // Function that clears the user from AwaitingInput[].
    let i = 0;
    let AwaitingInput = ReadAwaitingInput();
    for (i in AwaitingInput) {
        if (AwaitingInput[i].User == MsgObj.author.id) {
            AwaitingInput.splice(i, 1);
            WriteAwaitingInput(AwaitingInput);
            return;
        }
    }
}

//---------------------------------------------//
// Human readable way to refer to a function when requesting an event while
// having a non finished event already awaiting for a response.
//---------------------------------------------//

function CommandName(Event) {
    switch(Event) {
        case ChangePrefixRedir:
            return '"cambio de prefijo"';
        case CreateTourneyRedir:
            return '"creación de torneo"';
        case JoinTourneyRedir:
            return '"unirse a torneo"';
        case DeleteTourneyRedir:
            return '"eliminar torneo"';
    }
    return;
}