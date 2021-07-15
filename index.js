const Discord = require("discord.js");
const client = new Discord.Client();

const token = require("./auth.json").token;
const settings = require("./settings.json");

var ready = false;

client.once('ready', () => {
    console.log("Ready in " + client.guilds.cache.size);
    console.log(client.guilds.cache.map(g => `${g.name} [${g.id}]`).join("\n"));
    
    ready = true;
});

client.login(token);

async function userIsMod(user) {
    for(var role = 0; role < settings.mod_roles.length; role++) {
        var hasRole = (await user.roles.cache.get(settings.mod_roles[role])) !== undefined;

        if(hasRole) return true;
    }
    console.log("Attempt to use command from UNPERMITTED user " + user.id);
    return false;
}

function channelIsPermitted(channel) {
    for(var i = 0; i < settings.bot_channels.length; i++) {
        if(channel.id === settings.bot_channels[i]) return true;
    }
    console.log("Attempt to use command in UNPERMITTED channel " + channel.id);
    return false;
}

async function isMuted(user) {
    return await user.roles.cache.some(role => role.id === settings.mute_role);;
}

client.on('message', async (message) => {
    if(message.author.bot || !ready || 
      !message.content.startsWith(settings.prefix) ||
      !channelIsPermitted(message.channel)) return;
    
    var args = message.content.split(" ");
    args[0] = args[0].substring(settings.prefix.length);
    
    let isMod = await userIsMod(message.member);
    
    if(!isMod) {
        message.channel.send("You do not have the perms to perform this action.");
    } else if(args[0] === "help") {
        message.channel.send(
            "```" + 
            `Prefix: ${settings.prefix}\n` +
            `----------\n\n` + 
                settings.help.map(cmd => {
                    return `${settings.prefix}${cmd.command}: ${cmd.usage}\n\t${cmd.desc}`;
                }).join("\n\n") + 
            "```"
        );
    } else if(args[0] === "mute") {
        if(args.length >= 2) {
            var user = await message.guild.members.fetch(args[1]);
            if(user !== undefined) {
                let im = await isMuted(user);
                if(!im) {
                    message.channel.send(`Muting user ${user.user.tag}...`);
                    
                    var mute_category = message.guild.channels.cache.get(settings.mute_cat);
                    if(mute_category !== undefined) {
                        console.log("Creating new channel...");
                        
                        // Create the Permissions object
                        let permissionOverwrites = [
                            {
                                id: settings.everyone_role_id,
                                deny: ['VIEW_CHANNEL'],
                            },
                            {
                                id: args[1],
                                allow: ['VIEW_CHANNEL'],
                            }
                        ];

                        // Let all the mod roles view the muted channel
                        for(var role = 0; role < settings.mod_roles.length; role++) {
                            permissionOverwrites.push({
                                id: settings.mod_roles[role],
                                allow: ['VIEW_CHANNEL'],
                            });
                        }

                        // Create the channel
                        const mute_channel = await message.guild.channels.create(`mute ${args[1]}`, {
                            type: 'text',
                            parent: mute_category,
                            permissionOverwrites,
                            reason: "Created via mute command by Simple Mute bot",
                            topic: args[1]
                        });

                        message.channel.send(`Channel created at <#${mute_channel.id}>.`);

                        // Give the user the muted role
                        let muted_role = await message.guild.roles.cache.get(settings.mute_role);
                        user.roles.add(muted_role);

                        message.channel.send(`User given mute role. \`,unmute ${args[1]}\` to unmute.`)
                        mute_channel.send(`<@${args[1]}> ${settings.messages.mute}`);
                    } else {
                        message.channel.send(`ERROR! Invalid mute_cat ID. Please talk to the administrator of this bot for further assistance.`);
                        console.error(`ERROR! Invalid mute_cat ID. Ensure that "mute_cat" is a string and exists on the guild.`);
                    }
                } else {
                    message.channel.send("User is already muted.");
                }
            } else {
                message.channel.send("Invalid user ID. ( " + settings.prefix + "help )");
            }
        } else {
            message.channel.send("Not enough arguments. Please specify a discord ID ( " + settings.prefix + "help ).");
        }
    } else if(args[0] === "unmute") {
        if(args.length >= 2) {
            var user = await message.guild.members.fetch(args[1]);
            if(user !== undefined) {
                let im = isMuted(user);
                if(im) {
                    let active_mute_cat = message.guild.channels.cache.get(settings.mute_cat);
                    let arch_mute_cat = message.guild.channels.cache.get(settings.mute_cat_arch);

                    if(active_mute_cat instanceof Discord.CategoryChannel && arch_mute_cat instanceof Discord.CategoryChannel) {
                        let ch = await active_mute_cat.children.find(channel => channel.topic === args[1]);
                        if(ch !== undefined && ch instanceof Discord.TextChannel) {
                            ch.setParent(arch_mute_cat);
                            ch.overwritePermissions([{id: settings.everyone_role_id, deny: [['VIEW_CHANNEL'], ['SEND_MESSAGES']]}]); // no-one can view archived
                            
                            let mute_role = await message.guild.roles.cache.get(settings.mute_role);
                            user.roles.remove(mute_role);
                            ch.send(settings.messages.unmute);
                        } else {
                            message.channel.send("Unable to find the mute channel. Contact the admin for further assistance.");
                        }
                    } else {
                        message.channel.send("One or both of the given category IDs for mute categories do not resolve to a category. Contact the admin for further assistance.");
                        console.log("mute_cat: " + active_mute_cat instanceof Discord.CategoryChannel);
                        console.log("mute_cat_arch: " + arch_mute_cat instanceof Discord.CategoryChannel);
                    }
                } else {
                    message.channel.send("User is not muted. If you believe this is in error, contact the bot admin.");
                }
            } else {
                message.channel.send("Invalid user ID. ( " + settings.prefix + "help )");
            }
        } else {
            message.channel.send("Not enough arguments. Please specify a discord ID ( " + settings.prefix + "help ).");
        }
    }
});