# simple_mute
Simple discord bot to handle some custom mute functions

# Installation
1. Install node on your system
2. Clone or download the files to a folder on your system
3. Open command prompt and navigate to the folder
4. Run `npm install` - will download the required dependencies
5. Edit `auth.json` to include your bot's token
6. Edit `settings.json` and fill in details (listed below)
7. Run `node index.js` to start the bot

# Use
## settings.json and auth.json
### auth.json
token: discord bot token

### settings.json
prefix: command prefix (default: ,, e.g. ,help)

mute_cat: the ID of the category where the mute channels get made
mute_cat_arch: the ID of the category where the mute channels get archived
mute_role: the ID of the mute role. no function to create one yet
everyone_role_id: the ID of the everyone role on the server

mod_roles: an array of IDs of roles that can use the bot
bot_channels: an array of IDs of channels where the bot can be used in

help: information for the help command. no reason to touch, but you can if you want i guess

messages: store the messages the bot uses.
--- mute: the bot pings the user with a message in the new mute channel upon mute. this is that message
--- unmute: similarly, on unmute, the bot sends a message in the channel telling the user they can leave. this is that message

## Commands
help - see all the available commands, but as a messsage in discord

mute: `mute <discord uuid>`
    Mutes the user with the given discord ID. Creates hidden channel for mods & the muted user.

unmute: `unmute <discord uuid>`
    Releases the user with the given ID and archives the channel.
