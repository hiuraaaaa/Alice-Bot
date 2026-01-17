import { getGroup } from './groupSystem.js';
import { logger } from '../logger.js';

export async function handleParticipantsUpdate(sock, { id, participants, action }) {
    try {
        const groupData = await getGroup(id);
        const metadata = await sock.groupMetadata(id);
        
        for (let jid of participants) {
            let user = jid.split('@')[0];
            let groupName = metadata.subject;
            let memberCount = metadata.participants.length;

            if (action === 'add' && groupData.welcome.enabled) {
                let message = groupData.welcome.message
                    .replace('@user', `@${user}`)
                    .replace('{group}', groupName)
                    .replace('{count}', memberCount);
                
                await sock.sendMessage(id, { 
                    text: message, 
                    mentions: [jid] 
                });
                logger.group(`Welcome sent to ${user} in ${groupName}`);
            } else if (action === 'remove' && groupData.goodbye.enabled) {
                let message = groupData.goodbye.message
                    .replace('@user', `@${user}`)
                    .replace('{group}', groupName)
                    .replace('{count}', memberCount);
                
                await sock.sendMessage(id, { 
                    text: message, 
                    mentions: [jid] 
                });
                logger.group(`Goodbye sent to ${user} in ${groupName}`);
            }
        }
    } catch (e) {
        logger.error('Error in handleParticipantsUpdate:', e);
    }
}
