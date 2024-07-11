import React, { useCallback, useContext } from 'react';
import useAppRoot from '../components/context/useAppRoot';
import { get, ref } from 'firebase/database';
import { DayRow, default_twitter } from '../components/state/interfaces';
import { PublicKey } from '@solana/web3.js';
import { uInt32ToLEBytes, uInt8ToLEBytes } from '../components/blog/apps/common';
import { PROGRAM } from '../components/state/constants';


export const useGetDayEntries = () => {
    const { database, entryList, twitterList } = useAppRoot();
  
    return useCallback(async (date: number, setDayRows: React.Dispatch<React.SetStateAction<DayRow[]>>) => {
        if (database === null || entryList === null || twitterList === null) {
            setDayRows([]);
            return;
        }
    
        // get the listings
        const entries_db = await get(ref(database, "BlinkBash/entries/0/" + date));
        let entries = entries_db.val();
        if (entries === null) {
            setDayRows([]);
            return;
        }
    
        const prompt_db = await get(ref(database, "BlinkBash/prompts/0/" + date));
        let prompt_val = prompt_db.val();
    
        if (prompt_val === null) {
            setDayRows([]);
            return;
        }
        let json = JSON.parse(prompt_val.toString());
        let prompt_url = json["url"];
    
        let day_rows: DayRow[] = [];
        Object.entries(entries).forEach(([key, value]) => {
            let json = JSON.parse(value.toString());
            let creator = new PublicKey(key);
            let entry_account = PublicKey.findProgramAddressSync([creator.toBytes(), uInt8ToLEBytes(0), uInt32ToLEBytes(date)], PROGRAM)[0];
            let entry = entryList.get(entry_account.toString());
            let twitter = twitterList.get(key);
            if (entry === undefined) {
                return;
            }
    
            if (twitter === undefined) {
                twitter = default_twitter;
            }
    
            console.log("entry", twitter.username, entry.positive_votes)
    
            let row: DayRow = {
                key: key,
                twitter: twitter,
                score: entry.positive_votes - entry.negative_votes,
                link: "https://blinkbash.daoplays.org/api/blink?creator=" + key + "&game=0&date=" + date,
                entry: json.entry,
                prompt: prompt_url,
                claimed: entry.reward_claimed === 1,
            };
    
            day_rows.push(row);
        });
        const sortedList = [...day_rows].sort((a, b) => b.score - a.score);
    
        setDayRows(sortedList);
    }, [database, entryList, twitterList]); // Dependencies from context
  };