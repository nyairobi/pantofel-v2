import { PrismaClient, Song } from '@prisma/client';
import { Logging } from '../logger';
import { Service } from '../service';
import { TimedArray } from '../timedarray';
import Fuse from 'fuse.js'

type FindSongOptions = {
    titleOnly? : boolean;
    threshold? : number;
}

@Service ()
export class DatabaseService extends Logging {
    private m_client : PrismaClient;
    private m_songs : TimedArray<Song>;

    public constructor () {
        super ();
        this.info ('initializing database service');
        this.m_client = new PrismaClient ();
        this.m_songs = new TimedArray (30);
    }

    private get client () {
        return this.m_client;
    }

    public get guild () {
        return this.client.guild;
    }

    public get user () {
        return this.client.user;
    }

    public get song () {
        return this.client.song;
    }

    public get songRating () {
        return this.client.songRating;
    }

    public async findSong (keyword : string, options: FindSongOptions = {}) : Promise<Song[]> {
        if (this.m_songs.length === 0) {
            this.m_songs.data = await this.client.song.findMany();
        } 

        this.m_songs.refresh ();

        const fuseOptions = {
            includeScore: true,
            keys: options.titleOnly ? ['title'] : ['artist', 'title']
        };

        const fuse = new Fuse(this.m_songs.data, fuseOptions);
        const result = fuse.search(keyword);

        return result.filter (res => res.score! < (options.threshold ?? 0.4)).map (res => res.item);
    }
}