//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import Discord from 'discord.js';
import fs from "fs";
import {TourneyJSON, RandomPointsPhrase} from './Helpers.mjs';
import {SortByPoints} from './TourneyActions.mjs';
import {ReadBot, ReadPrefix} from './Bot.mjs';
import {CreateImage} from './Canvas.mjs';

export function ShowPoints(MsgObj) {

    if (TourneyJSON().Tourneys.length == 0) { // If no tournament is found.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, no existe ningún torneo!");
        return;
    }

    if (TourneyJSON().Tourneys[0].Active == false) { // If the tournament didn't start yet.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, el torneo ni siquiera comenzó!")
        return;
    }

    if (TourneyJSON().Tourneys[0].InPrelims == false) { // Creates image of tournament brackets.
        CreateImage(MsgObj, 0);
        return;
    }
    else { // If in prelims, shows everyone's points in a rich embed.

        const embed = new Discord.RichEmbed()

        .setColor("#AFEEEE")
        .setTitle('__**POSICIONES**__')
        .setThumbnail(ReadBot().user.avatarURL)
        .setDescription('Puntaje hasta la fecha.')
        .setFooter(RandomPointsPhrase())

        let i = 0;
        let Participants = TourneyJSON().Tourneys[0].Participants
        let Sorted = SortByPoints();

        for (i in Sorted[1]) {
            embed.addField("*" + (+i + +1) + ": __" + Participants[i].Nickname + "__*", Sorted[0][i] + " --- (" + Participants[i].GamesPlayed + " partidos jugados)")
        }

        MsgObj.channel.send(embed);
        return;
    }
}

export function ShowCommands(MsgObj) { // Shows all the available commands in a rich embed.

    let i = 0;
    let Commands = JSON.parse(fs.readFileSync("Commands.json", {encoding: "utf8"}));

    const embed = new Discord.RichEmbed()
    .setColor("#9932CC")
    .setTitle('***Todos los comandos que puedo recibir inicialmente:***\n \n ')
    .setThumbnail(ReadBot().user.avatarURL)
    .setFooter('No olvides comenzar todo lo que me digas con "' + ReadPrefix() + '", seguido de un espacio!')

    for (i in Commands) {
        embed.addField(Commands[i][0], Commands[i][1]);
    }

    MsgObj.channel.send(embed);
    return;
}