/*
 * commands/skip.ts
 * skip the current song
 */

import type { ChatInputCommandInteraction, Client, SlashCommandBuilder } from "discord.js";
import { CommandHandler } from "../command";
import { CommandExecutor } from "../executor";
import { Autowired } from "../service";
import { DatabaseService } from "../services/database";
import { PlaylistService } from "../services/playlist";
import { Util } from "../util";

@CommandHandler ()
class SkipCommand extends CommandExecutor {
    @Autowired ()
    private m_databaseService! : DatabaseService;

    @Autowired ()
    private m_playlistService! : PlaylistService;


    public constructor () {
        super ('skip', 'skip the current song')
    }

    public build () : SlashCommandBuilder {
        return (super.build ()
            .addBooleanOption(option => option
                .setName ('force')
                .setDescription ('force skip without voting (requires special privileges')
                .setRequired (false))
        ) as SlashCommandBuilder;
    }

    public async command (client : Client, interaction : ChatInputCommandInteraction) : Promise<void> {     
        const song = this.m_playlistService.getCurrentSong (); 
        const force = interaction.options.getBoolean ('force') ?? false;
        const userId = interaction.user.id;

        if (song !== null) {  
            const user = await this.m_databaseService.client.user.findUnique ({
                where: {
                    userId
                }
            });

            if (force && user !== null && user.canForceSkip) {
                if (this.m_playlistService.skipCurrentSong ()) {
                    const { embed, files } = Util.songEmbed (song)
                        .setColor ([255, 103, 72])
                        .setDescription ('Force skipped');
                    await interaction.reply ({ embeds: [embed], files });
                } else {
                    await interaction.reply ({ content: 'Failed to skip the song', ephemeral: true });
                }
            } else {
                const message = await interaction.deferReply({
                    fetchReply: true
                });
                const { voteCount, userCount } = await this.m_playlistService.voteSkip (userId, message);
                if (voteCount >= userCount / 2.0) {
                    this.m_playlistService.skipCurrentSong ()
                    const embed = Util.songEmbed (song)
                        .setColor ([255, 103, 72])
                        .setDescription ('Vote skipped');
                    await interaction.editReply ({ embeds: [embed] });
                } else {
                    await interaction.editReply ({
                        content: `${voteCount}/${Math.ceil (userCount / 2)}`,
                    });
                }
            }
        } else {
            await interaction.reply ({ content: 'Nothing is being played', ephemeral: true });
        }
    }
}