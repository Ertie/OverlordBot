//---------------------------------------------//
// Copyright (c) 2020 Ernesto Leonel Argüello.
// This file is covered by LICENSE at the root of this project.
//---------------------------------------------//

import Canvas from 'canvas-constructor';
import fetch from 'node-fetch';
import fs from "fs";
import {TourneyJSON, FetchParticipantByNickname, CheckEvenNum, FindBracketPlayersIndex, FindPairOpponentIndex} from './Helpers.mjs';
import OGCanvas from 'canvas';

var CreatingImage = false; // Gate that disallows people from spamming the command until it's finished.
var BracketPlayers = []
var DayPlayers = []
var DayPoints = []
var PrelimsPoints;
var FinalImage = undefined; // Gets updated with new iterations of the image until the final product is ready.
var ImagesArray = [] // Fills images in this array, for sending in order later, if there were to be more than 1.
var Positions;
OGCanvas.registerFont("./Images/KeaniaOne-Regular.ttf", {family: "KeaniaOne"})

//---------------------------------------------//
// Full image creation function for prelims and brackets. Most values are dynamic, based
// on the InstanceType function. Data coordinates are read from the ImagePositions.json.
//---------------------------------------------//

export async function CreateImage(MsgObj, InstanceType, Day) {

    async function FetchAvatars() { // Prepares all the buffers from the participants' profile pictures.

        BracketPlayers = [] // Used if making brackets image.
        DayPlayers = [] // Used if making prelims day image.
        let i = 0;
        let k = 0;
        let Brackets = TourneyJSON().Tourneys[0].Brackets;
        let Prelims = TourneyJSON().Tourneys[0].Prelims;
        let DayNicknames = [];
        PrelimsPoints = TourneyJSON().Tourneys[0].PrelimsPoints;

        if (InstanceType == 1) {

            for (i in Prelims[Day - 1]) { // Adds nicknames in a straight line for quick access.
                for (k in Prelims[Day - 1][i]) {
                    DayNicknames.push(Prelims[Day - 1][i][k])
                }
            }

            i = 0
            k = 0

            for (i in PrelimsPoints[Day - 1]) { // Adds points in a straight line for quick access.
                for (k in PrelimsPoints[Day - 1][i]) {
                    DayPoints.push(PrelimsPoints[Day - 1][i][k])
                }
            }
        }
        
        async function FetchAvatarsLoop(Index, InstanceType){ // Loops until all images are fetched.

            let Limit;
    
            switch (InstanceType) {
                case 0:
                    Limit = 8; // You only need the quarter finals images. Then duplicate appearances are copied.
                    break;
                case 1:
                    Limit = DayNicknames.length; // These get all fetched normally beforehand.
                    break;
            }
            
            if (Index == Limit) {
                return; // Out.
            }
    
            switch (InstanceType) { // These snakes get the avatar images from the user objects by nickname from
                case 0:             // their ID at Participants[]. Then they get buffered and pushed into the array.
                    BracketPlayers[Index].push((await (await fetch(await ((await FetchParticipantByNickname(Brackets[0][Index]))).avatarURL)).buffer()))
                    break;
                case 1:
                    DayPlayers[Index].push((await (await fetch(await ((await FetchParticipantByNickname(DayNicknames[Index]))).avatarURL)).buffer()))
                    break;
            }
            
            await FetchAvatarsLoop(Index + 1, InstanceType)
        }
        
        i = 0;

        // Concept of these arrays is [[nickname, buffer]] for easy access.
        if (InstanceType == 0) {
            for (i in Brackets[0]) {
                BracketPlayers.push([Brackets[0][i]])
            }
        }

        i = 0;
    
        if (InstanceType == 1) {
            for (i in DayNicknames) {
                DayPlayers.push([DayNicknames[i]])
            }
        }
    
        await FetchAvatarsLoop(0, InstanceType);
        return;
    }

    function SetTextOrImgPos(Index, InstanceType, Type, Coordinate) { // Reads ImagePositions.json for positions.
        let Instance;

        switch (InstanceType) {
            case 0:
                Instance = Positions.Brackets;
                break;
            case 1:
                Instance = Positions.Days;
                break;
        }
        return Instance[Type][Coordinate][Index];
    }

    function SetTextOrImgSize(Index, InstanceType, Type) { // Reads ImagePositions.json for sizes.
        let Instance;

        switch (InstanceType) {
            case 0:
                Instance = Positions.Brackets;
                break;
            case 1:
                Instance = Positions.Days;
                break;
        }
        return Instance[Type][2][Index];
    }

    async function ImageInstance(InstanceType) { // Creates the actual image.
        let i = 0;
        let Background;
        let Limit;
        let Run = 0;
        let BracketsPoints = TourneyJSON().Tourneys[0].BracketsPoints

        switch (InstanceType) {
            case 0:
                Background = "./Images/brackets.png";
                break;
            case 1:
                Background = "./Images/days.png";
                break;
        }

        switch (InstanceType) {
            case 0:
                Limit = 15 // Amount of entries at the brackets.
                break;
            case 1:
                if (DayPlayers.length < 8) {
                    Limit = DayPlayers.length // Multiple prelims images can have empty spaces in the last one.
                }
                else {
                    Limit = 8; // Amount of entries at prelims images.
                }
                break;
        }

        if (InstanceType == 0) { // Buffer duplication if brackets image.
            let Brackets = TourneyJSON().Tourneys[0].Brackets;

            // Replicates buffers instead of fetching everything. For speed.
            function CopyPlayerData(Nickname) {
                let k = 0;

                if (Nickname == null) {
                    BracketPlayers.push([null])
                    return;
                }

                for (k in Brackets[0]) {
                    if (Brackets[0][k] == Nickname) {
                        BracketPlayers.push([BracketPlayers[k][0], BracketPlayers[k][1]])
                        break;
                    }
                }
            }
            i = 0;

            for (; i != 4 ; i++) {
                if (Brackets[1][i] == 0) {
                    CopyPlayerData(null);
                    continue;
                }
                CopyPlayerData(Brackets[1][i]);
            }
            i = 0;

            for (; i != 2 ; i++) {
                if (Brackets[2][i] == 0) {
                    CopyPlayerData(null);
                    continue;
                }
                CopyPlayerData(Brackets[2][i]);
            }
            i = 0;

            for (; i != 1 ; i++) {
                if (Brackets[3][i] == 0) {
                    CopyPlayerData(null);
                    continue;
                }
                CopyPlayerData(Brackets[3][i]);
            }
        }

//---------------------------------------------//
// ImageInstanceLoop does the heavy lifting of iterating the images. Paints the same buffer over itself
// with the new information over different runs. Run 0 paints avatars and nicknames. Run 1 paints crosses
// over the avatars. Run 2 paints "VS" between pairs of players in each match.
//---------------------------------------------//

        async function ImageInstanceLoop(Index){ 

            if (Index == Limit) {
                if (InstanceType == 0) { // Runs for bracket images.
                    if (Run == 0) {
                        Limit = 14
                        Run = 1;
                        await ImageInstanceLoop(0)
                        return;
                    }
                    if (Run == 1) {
                        Limit = 8
                        Run = 2;
                        await ImageInstanceLoop(0)
                        return;
                    }
                }
                if (InstanceType == 1) { // Runs for prelims days images.
                    if (Run == 0) {
                        Run++;
                        await ImageInstanceLoop(0)
                        return;
                    }
                    if (Run == 1) {
                        Run++;
                        await ImageInstanceLoop(0)
                        return;
                    }
                    if (Run == 2) {
                        Run++;
                        await ImageInstanceLoop(0)
                        return;
                    }
                    // Limit for prelims images is 8 players. Then it shall create a completely new image.
                    if (DayPlayers.length > 8) {

                        i = 0
                        for (; i != 8; i++) {
                            DayPlayers.shift();
                            DayPoints.shift();
                        }

                        ImagesArray.push(FinalImage); // Pushes to final array.
                        FinalImage = undefined; // Resets image.

                        if (DayPlayers.length < 8) {
                            Limit = DayPlayers.length // Limit should be 8 or less.
                        }
                        else {
                            Limit = 8;
                        }
                        Run = 0 // Resets run value.
                        await ImageInstanceLoop(0);
                        return;
                    }
                }
                ImagesArray.push(FinalImage) // Pushes image.
                return; // This is the exit for the whole function.
            }

            // First index finds an unexistent image, so it should first paint the background to begin
            // the loop properly. This index is free; does not Index++ when rerunning.
            if (FinalImage == undefined) {

                let TourneyText;

                if (InstanceType == 0) {
                    TourneyText = [1260, 700, "right"]
                }
                if (InstanceType == 1) {
                    TourneyText = [640, 625, "center"]
                }

                let NewImage = new Canvas.Canvas (1280, 720)

                .printImage(await Canvas.resolveImage(Background), 0, 0, 1280, 720)
                .setTextFont("38px Urae Nium")
                .setColor("#b7babd")
                .setTextAlign(TourneyText[2])
                .printText(TourneyJSON().Tourneys[0].Name, TourneyText[0], TourneyText[1])
                .toBuffer();

                FinalImage = NewImage
                await ImageInstanceLoop(Index);
                return;
            }
            else {

                let PlayersArray; // Will be iterated for images.
                let FontType = "Urae Nium"; // Default font for everything.

                switch (InstanceType) { // PlayersArray turns into the necessary array.
                    case 0:
                        PlayersArray = BracketPlayers;
                        break;
                    case 1:
                        PlayersArray = DayPlayers;
                        break;
                }

                if (Run == 0) {

                    if (PlayersArray[Index][0] == null) { // Unspecified players show a "?" at the brackets.

                        FontType = "KeaniaOne" // Urae Nium does not have symbols.

                        // Blank needed here. To save on text, this following NewImage takes in an ungodly
                        // amount of dynamic values for proper looping, but Canvas.resolveImage can't 
                        // receive a null or undefined image, so we actually need to give it something.
                        PlayersArray[Index] = ["?", "./Images/Blank.png"]
                    }
                        
                    let NewImage = new Canvas.Canvas (1280, 720)

                    .printImage(await Canvas.resolveImage(FinalImage), 0, 0, 1280, 720) // Previous image.
                    .printCircularImage(await Canvas.resolveImage(PlayersArray[Index][1]), // Avatar.
                        SetTextOrImgPos(Index, InstanceType, 1, 0), // X position.
                        SetTextOrImgPos(Index, InstanceType, 1, 1), // Y position.
                        SetTextOrImgSize(Index, InstanceType, 1))   // Size.
                    .setTextFont((SetTextOrImgSize(Index, InstanceType, 0)) + "px " + FontType)
                    .setColor("#ffffff")
                    .setTextAlign("center")
                    .printText(PlayersArray[Index][0].toUpperCase(), // Nickname.
                        SetTextOrImgPos(Index, InstanceType, 0, 0),  // X position.
                        SetTextOrImgPos(Index, InstanceType, 0, 1))  // Y position.
                    .toBuffer(); // Done.

                    FinalImage = NewImage // Overwrite old.
                    await ImageInstanceLoop(Index + 1); // Loop.
                    return;
                }
                // Run specifications for bracket images.
                if (InstanceType == 0) {
                    if (Run == 1) { // Crosses on avatars.

                        // This horrible wall of code checks that the match has been played at all. No point
                        // giving crosses for players with 0 points if the match wasn't even played yet.
                        if (((BracketsPoints[FindBracketPlayersIndex(Index)[2]][FindBracketPlayersIndex(Index)[0]] == 0) &&
                        (BracketsPoints[FindBracketPlayersIndex(Index)[2]][FindBracketPlayersIndex(Index)[1]] == 1)) ||
                        ((BracketsPoints[FindBracketPlayersIndex(Index)[2]][FindBracketPlayersIndex(Index)[1]] == 0) &&
                        (BracketsPoints[FindBracketPlayersIndex(Index)[2]][FindBracketPlayersIndex(Index)[0]] == 1))){
                            
                            if (BracketsPoints[FindBracketPlayersIndex(Index)[2]][FindBracketPlayersIndex(Index)[0]] == 0) {
                                // Player lost, gets a cross.

                                let NewImage = new Canvas.Canvas (1280, 720)

                                .printImage(await Canvas.resolveImage(FinalImage), 0, 0, 1280, 720) // Previous image.
                                .printImage(await Canvas.resolveImage("./Images/RedCross.png"), // Cross image.
                                    (SetTextOrImgPos(Index, InstanceType, 1, 0) - 80), // X position.
                                    (SetTextOrImgPos(Index, InstanceType, 1, 1) - 55), 170, 110) // Y position.
                                .toBuffer();

                                FinalImage = NewImage; // Overwrite old.
                            }
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                        else {
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                    }
                    if (Run == 2) { // Versus text on matches.

                        if (CheckEvenNum([FindBracketPlayersIndex(Index)[0]])) {

                            let NewImage = new Canvas.Canvas (1280, 720)

                            .printImage(await Canvas.resolveImage(FinalImage), 0, 0, 1280, 720) // Previous image.
                            .setTextFont((SetTextOrImgSize(Index, InstanceType, 0) - 5) + "px " + FontType)
                            .setColor("#ffffff")
                            .printText("VS", // Versus text.
                                (SetTextOrImgPos(Index, InstanceType, 0, 0) - 15), // X position.
                                (SetTextOrImgPos(Index, InstanceType, 0, 1) + 41)) // Y position.
                            .toBuffer();

                            FinalImage = NewImage; // Overwrite old.
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                        else {
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                    }
                }
                // Run specifications for prelims images.
                if (InstanceType == 1) {
                    if (Run == 1) { // Crosses on avatars.

                        if (DayPoints[Index] == 0 && DayPoints[FindPairOpponentIndex(Index)] == 0) {
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                        else {
                            if (DayPoints[Index] == 0 || DayPoints[Index] == 1) {
                                // Player lost, gets a cross.

                                let NewImage = new Canvas.Canvas (1280, 720)

                                .printImage(await Canvas.resolveImage(FinalImage), 0, 0, 1280, 720) // Previous image.
                                .printImage(await Canvas.resolveImage("./Images/RedCross.png"), // Cross image.
                                    (SetTextOrImgPos(Index, InstanceType, 1, 0) - 85), // X position.
                                    (SetTextOrImgPos(Index, InstanceType, 1, 1) - 87), 170, 170) // Y position.
                                .toBuffer();

                                FinalImage = NewImage; // Overwrite old.
                            }
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                    }
                    if (Run == 2) { // Versus text on matches.

                        if (CheckEvenNum(Index)) {

                            let NewImage = new Canvas.Canvas (1280, 720)

                            .printImage(await Canvas.resolveImage(FinalImage), 0, 0, 1280, 720) // Previous image.
                            .setTextFont((SetTextOrImgSize(Index, InstanceType, 0) - 16) + "px " + FontType)
                            .setColor("#ffffff")
                            .printText("VS", // Versus text.
                                (SetTextOrImgPos(Index, InstanceType, 0, 0) - 25), // X position.
                                (SetTextOrImgPos(Index, InstanceType, 0, 1) + 78)) // Y position.
                            .toBuffer();

                            FinalImage = NewImage; // Overwrite old.
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                        else {
                            await ImageInstanceLoop(Index + 1); // Loop.
                            return;
                        }
                    }
                    if (Run == 3) { // Prelims images show the day info at the center.

                        let NewImage = new Canvas.Canvas (1280, 720)

                        .printImage(await Canvas.resolveImage(FinalImage), 0, 0, 1280, 720) // Previous image.
                        .setTextFont("120px Urae Nium")
                        .setColor("#000000") // Black shadow behind.
                        .setTextAlign("center")
                        .printText(("JORNADA " + Day), 643, 400)
                        .setColor("#800f0f") // Red word on top.
                        .printText(("JORNADA " + Day), 637, 400)
                        .toBuffer();

                        FinalImage = NewImage; // Overwrite old.
                        await ImageInstanceLoop(Index + 1); // Loop.
                        return;
                    }
                }
            }
        }

        await ImageInstanceLoop(0); // Runs the whole behemoth.
        return;
    }

    if (CreatingImage) { // Can't do if already creating an image.
        MsgObj.channel.send("<@" + MsgObj.author.id + ">, todavía estoy creando otra imagen!")
        return;
    }

    CreatingImage = true; // Now creating image.

    // Message alert about an image being created. Will get deleted later.
    const PrepImgMsg = await MsgObj.channel.send("<@" + MsgObj.author.id + ">, espera! Estoy creando la imagen 😣")
    
    // Everything gets reset before each run, as these variables are pretty global.
    BracketPlayers = [];
    DayPlayers = [];
    DayPoints = []
    ImagesArray = []
    FinalImage = null;
    Positions = JSON.parse(fs.readFileSync("ImagePositions.json", {encoding: "utf8"}));

    try {
        await FetchAvatars();
        await ImageInstance(InstanceType);

        // Methodically starts spitting out all the images that are inside ImagesArray.
        // You never know how many people can be playing a tournament.
        async function ResolveImgMsgs(Index) {
            if (Index == ImagesArray.length) {
                return;
            }
            const ImgMsg = await MsgObj.channel.send({files: [ImagesArray[Index]]})
            await ImgMsg.react('💩');
            ResolveImgMsgs(Index + 1)
            return;
        }

        await ResolveImgMsgs(0)
        await PrepImgMsg.delete() // Deletes the alert message.

        CreatingImage = false; // You can now request another image.

    } catch (error) {      // If anything fails, it will just nope out of the way and reset the CreatingImage
        console.log(error) // value to false, so that you can try again.

        CreatingImage = false;
        MsgObj.channel.send("Hubo un error al crear la imagen. 🤕 Podrías intentar de nuevo.")
    }

    return;
}

export async function EliminationImage(MsgObj, Nickname) {

    CreatingImage = true; // Can't request another image while this is happening.

    try {
        let BlackWhite; // Using the original canvas to B&W the profile picture of the loser.

        const NewCanvas = OGCanvas.createCanvas(512, 512);
        const ctx = NewCanvas.getContext('2d');
        // Another snake to fetch and buffer the avatar from the nickname they enrolled with.
        const avatar = await (await fetch(await (await FetchParticipantByNickname(Nickname)).avatarURL)).buffer();
        const background = await OGCanvas.loadImage(avatar);
        
        ctx.drawImage(background, 0, 0, NewCanvas.width, NewCanvas.height);
        let ImageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        var data = ImageData.data;

        for(var i = 0; i < data.length; i += 4) {

            var brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            data[i] = brightness; // Red channel
            data[i + 1] = brightness; // Green channel
            data[i + 2] = brightness; // Blue channel
        }
        ctx.putImageData(ImageData, 0, 0);
        BlackWhite = NewCanvas.toBuffer() // B&W'd image.

        let ElimImg = new Canvas.Canvas (512, 512) // Using canvas constructor to paint the rest of the text.

        .printImage(await Canvas.resolveImage(BlackWhite), 0, 0, 512, 512) // B&W image.
        .setTextFont("126px Urae Nium")
        .setTextAlign("center")
        .setColor("#000000") // Shadow.
        .printText(Nickname, 258, 256 - 28)
        .printText("ELIMINADO", 258, 256 + 98)
        .setColor("#800f0f") // Text.
        .printText(Nickname, 254, 256 - 28)
        .printText("ELIMINADO", 254, 256 + 98)
        .toBuffer();

        const ImgMsg = await MsgObj.channel.send({files: [ElimImg]}) // Sends the image to the channel.
        await ImgMsg.react('😭'); // Loser.

        CreatingImage = false; // You can now request another image.
        return;

    } catch (error) { // Error handling. Resets CreatingImage.
        console.log(error)
        CreatingImage = false;
        MsgObj.channel.send("Hubo un fallo al crear una imagen para el perdedor :(")
        return;
    }
}

export async function WinnerImage(MsgObj, Nickname) {
    
    CreatingImage = true;

    try {
        let WinnerBuf = await (await fetch(await (await FetchParticipantByNickname(Nickname)).avatarURL)).buffer();
        let WinnerImg = new Canvas.Canvas (1280, 720)

        .printImage(await Canvas.resolveImage("./Images/valorant_winner.png"), 0, 0, 1280, 720) // Background.
        .printImage(await Canvas.resolveImage(WinnerBuf), 509, 40, 260, 260) // Winner profile picture.
        .printImage(await Canvas.resolveImage("./Images/NeonFrame.png"), 487, 18, 304, 304) // Neon frame around pic.
        .toBuffer();

        const ImgMsg = await MsgObj.channel.send({files: [WinnerImg]}) // Sends the image to the channel.
        await ImgMsg.react('🔥'); // Winner!

        CreatingImage = false; // You can now request another image.
        return;

    } catch (error) { // Error handling. Resets CreatingImage.
        console.log(error)
        CreatingImage = false;
        MsgObj.channel.send("Hubo un fallo al crear una imagen para el ganador :(")
        return;
    }
}