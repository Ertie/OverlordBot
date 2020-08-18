//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import fs from "fs";
import {ParseMsgObj, TourneyJSON, CheckIfOnlyNum, SkipFirstSpace, SliceFromFirstSpace, GetFirstNumber, CheckEvenNum, FindBracketPlayersIndex, FindPairOpponentIndex} from './Helpers.mjs';
import {CreateImage} from "./Canvas.mjs";
import {ShowPoints} from "./RichEmbed.mjs";
import {WinnerImage, EliminationImage} from "./Canvas.mjs";

//---------------------------------------------//
// If you input "day" + a number, AssignPoints() shows the matchups of a specific preliminary day. It uses
// CanvasConstructor to create an image and sends it to the channel. Else, this function is extended by
// adding a player name + points. This sets points for each player under a set of scoring rules.
//---------------------------------------------//

export function AssignPoints(MsgObj, Keyword) {
    let MsgParsed = ParseMsgObj(MsgObj, true);
    let i = 0;
    let j = 0;
    let k = 0;
    let keyword = Keyword;
    let Day;
    let OpponentIndex = 0;
    let Player;
    let Points;
    let TourneyFile = JSON.parse(JSON.stringify(TourneyJSON()));
    // This back and forth of .stringify() and .parse() is done to bypass the assign-by-ref and
    // assigning it by value instead. It's important to read previous values later.

    function SetNumAttribute(FileInput, Nickname, Value, Data) {
        let i = 0;
        let Tournament = JSON.parse(JSON.stringify(FileInput.Tourneys[0]))
        let Player;
        let Day = Data[0];
        let Match = Data[1];
        let PlayerIndex = Data[2];
        let LastPoints = (TourneyJSON().Tourneys[0].PrelimsPoints[Day][Match][PlayerIndex]);
    
        for (i in Tournament.Participants) {
            if (Tournament.Participants[i].Nickname.toLowerCase() == Nickname.toLowerCase()) {

                Player = JSON.parse(JSON.stringify(Tournament.Participants[i])); // Find player in participants.

                switch (Value) { // Player either won or lost a game depending on the points they got, and
                    case 0:      // depending on the last points. This allows correction of points wrongly set
                                 // without having to go in the JSON and change them "manually".

                        if (LastPoints == 0 || LastPoints == 1) {
                            if (Tournament.PrelimsPoints[Day][Match][0] == 0 && Tournament.PrelimsPoints[Day][Match][1] == 0) {
                                Player.GamesLost++;
                                break;
                            }
                            break;
                        }
                        Player.GamesLost++;
                        Player.GamesWon--;
                        break;
                    case 1:
                        if (LastPoints == 0 || LastPoints == 1) {
                            if (Tournament.PrelimsPoints[Day][Match][0] == 0 && Tournament.PrelimsPoints[Day][Match][1] == 0) {
                                Player.GamesLost++;
                                break;
                            }
                            break;
                        }
                        Player.GamesLost++;
                        Player.GamesWon--;
                        break;
                    case 2:
                        if (LastPoints == 2 || LastPoints == 3) {
                            break;
                        }
                        Player.GamesWon++;
                        if (Tournament.PrelimsPoints[Day][Match][0] == 0 && Tournament.PrelimsPoints[Day][Match][1] == 0) {
                            break;
                        }
                        Player.GamesLost--;
                        break;
                    case 3:
                        if (LastPoints == 2 || LastPoints == 3) {
                            break;
                        }
                        Player.GamesWon++;
                        if (Tournament.PrelimsPoints[Day][Match][0] == 0 && Tournament.PrelimsPoints[Day][Match][1] == 0) {
                            break;
                        }
                        Player.GamesLost--;
                        break;
                }
                Player.Points = Player.Points + (Value - LastPoints); // Total points account for correction.
    
                Tournament.Participants[i] = Player;
                TourneyFile.Tourneys[0] = Tournament; // TourneyFile is set on AssignPoints() scope.
                return;
            }
        }
        console.log("couldn't find player");
        return;
    }

    if (TourneyJSON().Tourneys.length == 0) { // If no tournament is found.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no existe ningún torneo!");
        return;
    }
    
    if (TourneyJSON().Tourneys[0].Active == false) {
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, el torneo ni siquiera comenzó!")
        return;
    }

    if (MsgParsed.length == keyword.length) { // length of the function word.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, usa '*__day__ + __un numero__*' para recibir una imagen con los partidos de ese día.")
        return;
    }

    MsgParsed = SkipFirstSpace(MsgParsed.slice(keyword.length)); // Bypasses "day" and reads the rest.
    Day = GetFirstNumber(MsgParsed); // Day N° used.

    if (parseInt(Day) <= 0 || Day.length == 0) { // Invalid number.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, deberías entrar un número válido.")
        return;
    }

    if (parseInt(Day) >= TourneyJSON().Tourneys[0].Prelims.length + 1) { // If the number is not > than amount of game days.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no hay tantas jornadas en la fase preliminar del torneo! Ésta fase tiene " + TourneyJSON().Tourneys[0].Prelims.length + " jornadas.");
        return;
    }
    
    if (MsgParsed.length == Day.length) {
        if (keyword == "day") { // Only "day" +number will create an image with the matchups.
        CreateImage(MsgObj, 1, Day) //Should fetch game day
            return;
        }
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, luego del número se debe aclarar un jugador del cual resetear datos.");
        return;
    }

    MsgParsed = SkipFirstSpace(MsgParsed.slice(Day.length)); // Bypasses the number and reads the rest.
    Player = SliceFromFirstSpace(MsgParsed); // Player name.

    function FindPlayerAndMatch(){ // If the player exists, sets i to the match N° they should play.
        for (i in TourneyJSON().Tourneys[0].Prelims[Day - 1]) {
            for (j in TourneyJSON().Tourneys[0].Prelims[Day - 1][i]) {
                if (TourneyJSON().Tourneys[0].Prelims[Day - 1][i][j].toLowerCase() == Player.toLowerCase()) {
                    return true;
                }
            }
        }
        return false;
    }

    if (FindPlayerAndMatch()) {
        console.log('"' + Player + '" has been found at match ' + (+i + +1));
        if (MsgParsed.length == Player.length) {
            if (keyword == "reset") {
                if (TourneyFile.Tourneys[0].AdminPoints == true && TourneyFile.Tourneys[0].Creator != MsgObj.author.id) {
                    MsgObj.channel.send("<@" + MsgObj.author.id + ">, solo el creador del torneo puede reiniciar los puntos en una partida.")
                    return;
                }
                console.log('Reset function at day ' + Day + ', match ' + (+i + +1) + ', player "' + Player + '"');

                if (j == 0) { // Index for opponent is the index that's not the current player.
                        OpponentIndex = 1;
                }
                let PlayerNickname = TourneyFile.Tourneys[0].Prelims[Day - 1][i][j]; // Read player's name with capitalization and all.
                let OpponentNickname = TourneyFile.Tourneys[0].Prelims[Day - 1][i][OpponentIndex]; // Read opponent's name.

                if (TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][0] == 0 && TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][1] == 0) {
                    MsgObj.channel.send("<@" + MsgObj.author.id + ">, esa partida no se jugó todavía!");
                    return;
                }

                else {
                    for (k in TourneyFile.Tourneys[0].Participants) {
                        if (TourneyFile.Tourneys[0].Participants[k].Nickname.toLowerCase() == OpponentNickname.toLowerCase()) {
                            // Code that will execute for the opponent.
                            TourneyFile.Tourneys[0].Participants[k].GamesPlayed--;
                            TourneyFile.Tourneys[0].Participants[k].Points = TourneyFile.Tourneys[0].Participants[k].Points - TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][OpponentIndex];
                            // This decreased the games played by 1 and cancelled out the points from that particular match.
                            if (TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][j] == 0 || TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][j] == 1) {
                                TourneyFile.Tourneys[0].Participants[k].GamesWon--; // If they had won, now they didn't.
                            }
                            else {
                                TourneyFile.Tourneys[0].Participants[k].GamesLost--; // Same for a loss.
                            }
                        }
                        if (TourneyFile.Tourneys[0].Participants[k].Nickname.toLowerCase() == Player.toLowerCase()) {
                            // Code that will execute for the current player.
                            TourneyFile.Tourneys[0].Participants[k].GamesPlayed--;
                            TourneyFile.Tourneys[0].Participants[k].Points = TourneyFile.Tourneys[0].Participants[k].Points - TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][j]

                            if (TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][j] == 0 || TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][j] == 1) {
                                TourneyFile.Tourneys[0].Participants[k].GamesLost--;
                            }
                            else {
                                TourneyFile.Tourneys[0].Participants[k].GamesWon--;
                            }
                        }
                    }
                    TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][j] = 0; // Reset points at PrelimsPoints.
                    TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][OpponentIndex] = 0;
                    fs.writeFileSync("Tourney.json", JSON.stringify(TourneyFile));
                    MsgObj.channel.send('Se reinició correctamente la partida del día ' + Day + ' entre ' + PlayerNickname + ' y ' + OpponentNickname + '.')
                    return;
                }
            }
            return;
        }
        Points = SkipFirstSpace(MsgParsed.slice(Player.length)) // Bypasses player name and reads the rest.
        if (CheckIfOnlyNum(Points)) { // Please don't try to break the program, darnit.
            if (keyword == "day") {
                if (TourneyJSON().Tourneys[0].AdminPoints) {
                    if (TourneyJSON().Tourneys[0].Creator != MsgObj.author.id) { // Is it only an admin feature to set points?
                        MsgObj.channel.send("<@" + MsgObj.author.id + ">, solo el creador del torneo puede asignar los puntos!");
                        return;
                    }
                }

                if (j == 0) { // Index for opponent is the index that's not the current player.
                        OpponentIndex = 1;
                }
                let PlayerNickname = TourneyFile.Tourneys[0].Prelims[Day - 1][i][j]; // Read player's name with capitalization and all.
                let OpponentNickname = TourneyFile.Tourneys[0].Prelims[Day - 1][i][OpponentIndex]; // Read opponent's name.

                if (Points == 0 || Points == 1 || Points == 2 || Points == 3) { // Only valid entries.
                    let PrelimsPointsMatch = JSON.parse(JSON.stringify((TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i])));

                    if (TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][0] == 0 && TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i][1] == 0) {
                        // Every new entry for points gives each player a +1 in games played.
                        for (k in TourneyFile.Tourneys[0].Participants) {
                            if (TourneyFile.Tourneys[0].Participants[k].Nickname.toLowerCase() == OpponentNickname.toLowerCase()) {
                                TourneyFile.Tourneys[0].Participants[k].GamesPlayed++;
                            }
                            if (TourneyFile.Tourneys[0].Participants[k].Nickname.toLowerCase() == Player.toLowerCase()) {
                                TourneyFile.Tourneys[0].Participants[k].GamesPlayed++;
                            }
                        }
                    }
                    
                    SetNumAttribute(TourneyFile, Player, parseInt(Points), [Day - 1, i, j]); // Sets Points, GamesWon and GamesLost for player.
                    PrelimsPointsMatch[j] = parseInt(Points); // Player match points for the table.

                    switch (parseInt(Points)) { // Sets Points, GamesWon and GamesLost for opponent.
                        case 0:
                            SetNumAttribute(TourneyFile, OpponentNickname, 3, [Day - 1, i, OpponentIndex]);
                            PrelimsPointsMatch[OpponentIndex] = 3;
                            break;
                        case 1:
                            SetNumAttribute(TourneyFile, OpponentNickname, 2, [Day - 1, i, OpponentIndex]);
                            PrelimsPointsMatch[OpponentIndex] = 2;
                            break;
                        case 2:
                            SetNumAttribute(TourneyFile, OpponentNickname, 1, [Day - 1, i, OpponentIndex]);
                            PrelimsPointsMatch[OpponentIndex] = 1;
                            break;
                        case 3:
                            SetNumAttribute(TourneyFile, OpponentNickname, 0, [Day - 1, i, OpponentIndex]);
                            PrelimsPointsMatch[OpponentIndex] = 0;
                            break;
                    }
                    TourneyFile.Tourneys[0].PrelimsPoints[Day - 1][i] = PrelimsPointsMatch; // Replace match at tourney.
                    fs.writeFileSync("Tourney.json", JSON.stringify(TourneyFile)); // Final write of the JSON.
                    MsgObj.channel.send("Se setearon los puntos para " + PlayerNickname + " y " + OpponentNickname + " en la jornada " + Day + ".");
                    return;
                }
                MsgObj.channel.send("<@" + MsgObj.author.id + ">, se deben entrar valores válidos!");
                return;
            }
        }
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, solo se pueden ingresar valores numéricos!");
        return;
    }
    MsgObj.channel.send('<@' + MsgObj.author.id + '>, ningún jugador llamado "' + Player + '" se encontró esa jornada.');
    return;
}

//---------------------------------------------//

export function BracketPoints(MsgObj) {

    let MsgParsed = ParseMsgObj(MsgObj, true);
    let i = 0;
    let file = TourneyJSON()
    let Tourney = file.Tourneys[0]

    if (TourneyJSON().Tourneys.length == 0) { // If no tournament is found.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no existe ningún torneo!");
        return;
    }
    
    if (TourneyJSON().Tourneys[0].Active == false) { // If the tournament didn't start yet.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, el torneo ni siquiera comenzó!")
        return;
    }

    if (MsgParsed == "points") { // If no player is specified.
        ShowPoints(MsgObj);
        return;
    }

    MsgParsed = SkipFirstSpace(MsgParsed.slice(6)); // Bypasses the number and reads the rest.
    let Player = SliceFromFirstSpace(MsgParsed); // Player name.
    console.log("'" + Player + "'")

    // Reads the brackets and resolves which is the last match that a certain player has pending.
    function FindAndAssignBracketPoints() { 

        function AssignPairs(ArrayNum, Index) {
            
            function ResolveNextIndex(Index) {  // Players in a specific pair go to a specific
                if (Index == 0 || Index == 1) { // index in the next pair.
                    return 0;
                }
                if (Index == 2 || Index == 3) {
                    return 1;
                }
                if (Index == 4 || Index == 5) {
                    return 2;
                }
                if (Index == 6 || Index == 7) {
                    return 3;
                }
            }

            if (String(Tourney.Brackets[ArrayNum][Index]).toLowerCase() == Player) {
                if (Tourney.Brackets[ArrayNum][FindPairOpponentIndex(Index)] != null) { // If the player has a pair.

                    Tourney.BracketsPoints[ArrayNum][Index] = 1; // Gives a win to the winner.
                    Tourney.BracketsPoints[ArrayNum][FindPairOpponentIndex(Index)] = 0; // Gives a loss to the loser.

                    // This moves the player to the next bracket.
                    Tourney.Brackets[ArrayNum + 1][ResolveNextIndex(Index)] = Tourney.Brackets[ArrayNum][Index]; 

                    fs.writeFileSync("Tourney.json", JSON.stringify(file));
                    return 1; // Successfully resolved.
                }
                else {
                    return 2; // Player doesn't have a pair.
                }
            }
            return 0; // Player was not found.
        }

        let PairingResult;

        //Reading brackets from last to first to find pending matches.
        for (i in Tourney.Brackets[2]) { // Finals.
            PairingResult = AssignPairs(2, i)

            if (PairingResult == 1) {
                MsgObj.channel.send("Se asignó a " + Tourney.Brackets[2][i] + " como vencedor en ese partido.")
                EliminationImage(MsgObj, Tourney.Brackets[2][FindPairOpponentIndex(i)]) // Loser image.
                WinnerImage(MsgObj, Tourney.Brackets[2][i]) // Tournament winner.
                return;
            }
            if (PairingResult == 2) {
                MsgObj.channel.send("A esperar! Todavía " + Tourney.Brackets[2][i] + " no tiene contrincante para ese partido.")
                return;
            }
        }
        
        for (i in Tourney.Brackets[1]) { // Semifinals.
            PairingResult = AssignPairs(1, i)

            if (PairingResult == 1) {
                MsgObj.channel.send("Se asignó a " + Tourney.Brackets[1][i] + " como vencedor en ese partido.")
                EliminationImage(MsgObj, Tourney.Brackets[1][FindPairOpponentIndex(i)]) // Loser image.
                return;
            }
            if (PairingResult == 2) {
                MsgObj.channel.send("A esperar! Todavía " + Tourney.Brackets[1][i] + " no tiene contrincante para ese partido.")
                return;
            }
        }

        for (i in Tourney.Brackets[0]) { // Quarter finals.
            PairingResult = AssignPairs(0, i)

            if (PairingResult == 1) {
                MsgObj.channel.send("Se asignó a " + Tourney.Brackets[0][i] + " como vencedor en ese partido.")
                EliminationImage(MsgObj, Tourney.Brackets[0][FindPairOpponentIndex(i)]) // Loser image.
                return;
            }
            if (PairingResult == 2) {
                MsgObj.channel.send("A esperar! Todavía " + Tourney.Brackets[0][i] + " no tiene contrincante para ese partido.")
                return;
            }
        }
        
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no se encontró un jugador con ese nombre.")
        return;
    }

    FindAndAssignBracketPoints();
    return;
}