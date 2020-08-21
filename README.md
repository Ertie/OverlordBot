# Welcome to OverlordBot!

This bot can hold tournaments between members of your Discord server! 👾\
This includes the prompting for creating the tournament, member enrolling, pairs creation for preliminary matches (all possible combinations, for bracket placing) and keeping track of matches at the brackets phase.

It can also create images of every game day with the pairs of matches (preliminary phase), or images of the brackets. It will use the nickname the players enrolled with and their Discord profile picture. All super nice.
Losers at the brackets phase also get a little image, and the tournament winner gets a custom image.

## How to use it:

Clone this repository, modify Token.json and assign the token that corresponds to your bot at Bot.mjs.
Do bots[0] or bots[1] accordingly.

`const token = JSON.parse(fs.readFileSync("Token.json", {encoding: "utf8"})).bots[1].token;`

You'll find this line at the beginning of the file. I kept it this way for quick testing of features without it being intrusive between servers.

![Tokens JSON](/Images/Readme/ReadmeTokens.png)

To leverage Node.js functionality for importing different raw JS files, all source files are appended with the extension '.mjs'.\
__As of Node.js v12.16.1__, the way to run files with this importing method uses Node's `--experimental-modules`.

So you would run a Node instance in the folder with the line:

`node --experimental-modules .`

You can already start giving it commands. Here's the list of starter commands it can read:

- *changeprefix*
  - Use this to change the prefix.

- *createtourney*
  - Tool for creating a tourney with custom name and size.
  
- *deletetourney*
  - For deleting the current tournament. Handle with care.
  
- *join*
  - Users can join an open tournament with this command.
  
- *begintourney*
  - Closes enrollment. Begins the preliminary phase and creates pairs of matches per game day.
  
- *beginbrackets*
  - Finishes prelims phase and begins brackets phase to decide a winner.
  
- *points*
  - During the preliminary phase, shows a list of players, ordered by points.
  - During the brackets phase, shows an image with all the played and pending games of the tournament. Here you can use '*__points__ + __nickname__*' to assign a player as winner of their last pending match.
  
- *day*
  - '*__day__ + __a number__*' creates an image and shows the pairs in a prelim day.
  - '*__day__ + __a number__ + __nickname__ + __points__*' assigns points for the player, and the opposing points for their opponent. (0-3, 1-2, 2-1 or 3-0)
  
- *reset / clear*
  - '*__reset__ + __a number__ + __nickname__*' restores points for both players in a prelim match to 0.
  
- *adminpoints*
  - Tournament creator can use '*__adminpoints__ + __0__ / __1__*' to forbid or allow participants to assign points by themselves. Forbidden by default.
  
- *help*
  - Requests this same list of commands again.

__Everything you mean for the bot to read should carry the prefix.__

After everyone joined, you can begin the preliminary phase by doing '*OL begintourney*'.\
Let's say we started an 8 player tournament. This would create 7 days with 4 pairs of matches each. Then doing '*OL day 1*' would bring an image like this one:

![Prelims](/Images/Readme/ReadmePrelims.png)\
*Character limit for nicknames is 11, but I'm not doing font check and resizing when having too many big characters, so some nicknames can be huge. It's what we have for the moment.*

(Had there been more players, it would keep printing 4-pairs *(max)* images until it's out of matches to show.)

From here you can set points with the '*__day__*' command.\
Doing '*OL points*' here brings everyone's points in a rich embed.

After all matches are played and all the points set, you can begin the brackets phase by doing '*OL beginbrackets*'. First 8 make it to the brackets. Then, doing '*OL points*' should spew out an image like this one:

![Brackets Empty](/Images/Readme/ReadmeBracketsEmpty.png)

Developing the brackets by doing '*OL points __nickname__*' should make the image look like this:

![Brackets Full](/Images/Readme/ReadmeBracketsFull.png)

As players lose throughout the tournament, this image will get printed for them:

![Loss](/Images/Readme/ReadmeLoss.png)

And the winner will get this image printed for them:

![Win](/Images/Readme/ReadmeWin.png)\
*Yes, the bot reacts to its own images. It's truly happy for you.*

## How it works:

### __Basics__

Even though the whole product could be rather complex, the main concept is very simple.

You can input commands such as '*OL createtourney*' to begin the necessary prompts that give the bot the info it needs. The bot remembers the users it's talking to like any normal bot would. This is done through the use of redirectors and a "pending inputs" array called AwaitingInput. More on this at AwaitingInput.mjs.

![Awaiting Input](/Images/Readme/ReadmeAwaitingInput.png)

After creating a tourney, this is Tourney.json:

![TourneyJSON](/Images/Readme/ReadmeTourneyJSON.png)\

This is the entry for a newly added participant:

![Participant](/Images/Readme/ReadmeParticipant.png)\

### Images

Images are resolved inside Canvas.mjs using Canvas-Constructor. That small .mjs takes care of gathering all the nicknames and avatar images and putting together the images, as requested. 

If you wanted to change any of the backgrounds to use new images, you would look here:

![Backgrounds](/Images/Readme/ReadmeBackgrounds.png)\

Text and image positions are read from functions that fetch from ImagePositions.json. Looking into that JSON, you would find it filled with integer values corresponding to the following examples:

![Image Positions](/Images/Readme/ReadmeImagePositions.png)\
*Demonstration purposes only. The JSON actually works.*

More on this at Canvas.mjs.

## Known issues:

1. At the moment, only one tournament can be held at a time.

2. Little error handling for asynchronous data aside from image creation: as this was originally supposed to be a simple in-house bot, any failure in fetching Discord's API isn't accounted for.\
Nevertheless, there's no piece of data written in a .json before all the proper information is finished gathering. This means that if a disconnection happens during any multi-prompt commmand, you can simply restart the bot and the users would only need to rerun their commands. No strings attached.\
Needless to say, you cannot request another image if one is being created. You just can't; it won't let you. Don't be that guy.

3. Fonts for nicknames in images do not do size checking in any way, so a hard limit of 11 characters per name can make it look quite ugly if anyone name themselves "WWWWWWWWWWW".

4. This bot is currently made only to work on one server at a time. Not that it wouldn't necessarily work, but the AwaitingInput[] variable holds the users out in the open instead of encapsulating them by server. Doing it multi-server would just be a couple of hours of refactoring away, though.

-----------------------------------------------------

*If you need help with localization or any other inquiries, feel free to contact me on Discord at __Ertie#1858__!*\
*Or at [Twitter](http://twitter.com/Ertie_exe)!!*