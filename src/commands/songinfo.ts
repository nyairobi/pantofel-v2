/*
 * commands/songinfo.ts
 * get information about a song
 */

import { AttachmentBuilder, AutocompleteInteraction, ChatInputCommandInteraction, Client, SlashCommandBuilder } from 'discord.js';
import { CommandHandler } from '../command';
import { CommandExecutor } from '../executor';
import { Autowired } from '../service';
import { DatabaseService } from '../services/database';
import { PlaylistService } from '../services/playlist';
import { Util } from '../util';
import config from '../config.json';
import type { Song } from '@prisma/client';

@CommandHandler ()
class SonginfoCommand extends CommandExecutor {
    @Autowired ()
    private m_databaseService! : DatabaseService;

    @Autowired ()
    private m_playlistService! : PlaylistService;

    public constructor () {
        super ('songinfo', 'get information about a song');
    }

    public build () : SlashCommandBuilder {
        return (super.build ()
            .addNumberOption (option => option
                .setName ('song')
                .setDescription ('the song to show')
                .setRequired (false)
                .setAutocomplete (true))
        ) as SlashCommandBuilder;
    }

    public async command (client : Client, interaction : ChatInputCommandInteraction) : Promise<void> {
        const songId = interaction.options.getNumber ('song') ;
        
        if (songId !== null) {
            const song = await this.m_databaseService.song.findUnique ({
                where : {
                    songId
                }
            });
            if (song !== null) {
                const { embed, files } = Util.songEmbed (song);
                await interaction.reply ({ embeds : [embed], files });
                await interaction.followUp ({ files: [this.songEmbed (song)]});
            } else {
                await interaction.reply ({ content : 'This song does not exist in the database.', ephemeral : true });
            }
        } else {
            const song = this.m_playlistService.getCurrentSong ();
            if (song !== null) {
                const { embed, files } = Util.songEmbed (song);
                await interaction.reply ({ embeds : [embed], files } )
                await interaction.followUp ({ files: [this.songEmbed (song)]});
            } else {
                await interaction.reply ({ content : 'No song is currently being played', ephemeral : true });
            }
        }
    }

    public async autocomplete (client : Client, interaction : AutocompleteInteraction) : Promise<void> {
        const input = interaction.options.getFocused ();

        if (input.length > 1) {
            const songs = await this.m_databaseService.findSong (input);

            await interaction.respond (songs.map (song => { 
                return { 
                    name : `${song.artist} — ${song.title}`, 
                    value : song.songId
                }
            }));
        } else {
            await interaction.respond ([]);
        }
    }

    private songEmbed (song : Song) : AttachmentBuilder {
        const res = new AttachmentBuilder (`${config.storage.musicDirectory}/${song.songId}.opus`);
        res.setName (`${song.artist} - ${song.title}.ogg`);
        return res;
    }
}