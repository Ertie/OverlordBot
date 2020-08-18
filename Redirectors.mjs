//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import {ChangePrefixPrompt, ChangePrefixReceive, ChangePrefixResolve} from './ChangePrefix.mjs';
import {CreateTourneyPrompt, CreateTourneyName, CreateTourneySize} from './CreateTourney.mjs';
import {JoinTourneyPrompt, JoinTourneyName} from './JoinTourney.mjs';
import {DeleteTourneyPrompt, DeleteTourneyResolve} from './TourneyActions.mjs';

//---------------------------------------------//
// Redirectors take a state and redirect the user to the corresponding layer in an event.
//---------------------------------------------//

export function ChangePrefixRedir(MsgObj, State) { // Redirector for the prefix change.
    switch(State) {
        case 0:
            ChangePrefixPrompt.bind(null, MsgObj)();
            break;
        case 1:
            ChangePrefixReceive.bind(null, MsgObj)();
            break;
        case 2:
            ChangePrefixResolve.bind(null, MsgObj)();
            break;
    }
    return;
}

//---------------------------------------------//

export function CreateTourneyRedir(MsgObj, State) { // Redirector for tournament creation.
    switch(State) {
        case 0:
            CreateTourneyPrompt.bind(null, MsgObj)();
            break;
        case 1:
            CreateTourneyName.bind(null, MsgObj)();
            break;
        case 2:
            CreateTourneySize.bind(null, MsgObj)();
            break;
    }
}

//---------------------------------------------//

export function DeleteTourneyRedir(MsgObj, State) { // Redirector for deleting a tournament.
    switch(State) {
        case 0:
            DeleteTourneyPrompt.bind(null, MsgObj)();
            break;
        case 1:
            DeleteTourneyResolve.bind(null, MsgObj)();
            break;
    }
}

//---------------------------------------------//

export function JoinTourneyRedir(MsgObj, State) { // Redirector for joining an open tournament.
    switch(State) {
        case 0:
            JoinTourneyPrompt.bind(null, MsgObj)();
            break;
        case 1:
            JoinTourneyName.bind(null, MsgObj)();
            break;
    }
}

//---------------------------------------------//