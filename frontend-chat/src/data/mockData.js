export const currentUser = { id: 1, name: 'Apni', avatar: 'https://i.pravatar.cc/150?u=1' };

export const initialConversations = [
    {
        id: 101,
        name: 'Omar Faruk',
        avatar: 'https://i.pravatar.cc/150?u=101',
        lastMessage: 'Agamikal backend connect korbo!',
        time: '10:30 AM',
        unread: 2,
        isOnline: true
    },
    {
        id: 102,
        name: 'Laravel Devs BD',
        avatar: 'https://ui-avatars.com/api/?name=Laravel+Devs&background=ef4444&color=fff',
        lastMessage: 'Keu ki Reverb niye kaj korechen?',
        time: 'Gotokal',
        unread: 0,
        isOnline: false,
        isGroup: true
    },
    {
        id: 103,
        name: 'John Doe',
        avatar: 'https://i.pravatar.cc/150?u=103',
        lastMessage: 'Thik ache, dekha hobe.',
        time: 'Mongolbar',
        unread: 0,
        isOnline: true
    }
];

export const mockMessages = {
    101: [
        { id: 1, senderId: 101, text: 'Bhai, chat app er kaj koto dur?', time: '10:00 AM' },
        { id: 2, senderId: 1, text: 'Kaj valoi cholche! UI pray shesh.', time: '10:05 AM' },
        { id: 3, senderId: 101, text: 'Darun. Reverb add korechen?', time: '10:12 AM' },
        { id: 4, senderId: 1, text: 'Ekhono na, aage React design ta shesh korchi.', time: '10:15 AM' },
        { id: 5, senderId: 101, text: 'Agamikal backend connect korbo!', time: '10:30 AM' },
    ]
};