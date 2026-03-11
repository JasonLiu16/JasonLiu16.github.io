// 本地存储作为备用方案
const STORAGE_KEYS = {
    USERS: 'chat_users',
    FRIENDS: 'chat_friends',
    FRIEND_REQUESTS: 'chat_friend_requests',
    POSTS: 'chat_posts',
    MESSAGES: 'chat_messages'
};

// 初始化本地存储
function initLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FRIENDS)) {
        localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FRIEND_REQUESTS)) {
        localStorage.setItem(STORAGE_KEYS.FRIEND_REQUESTS, JSON.stringify({}));
    }
    if (!localStorage.getItem(STORAGE_KEYS.POSTS)) {
        localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify({}));
    }
}

// 本地存储操作
function getLocalStorage(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function setLocalStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// API调用函数
async function apiCall(endpoint, method = 'GET', data = null) {
    // 初始化本地存储
    initLocalStorage();
    
    // 模拟API响应
    switch (endpoint) {
        case '/api/users':
            return getLocalStorage(STORAGE_KEYS.USERS);
        
        case '/api/register':
            const users = getLocalStorage(STORAGE_KEYS.USERS);
            if (users.some(u => u.username === data.username)) {
                return { error: '用户名已存在' };
            }
            const newUser = {
                id: Date.now().toString(),
                username: data.username,
                password: data.password,
                online: true
            };
            users.push(newUser);
            setLocalStorage(STORAGE_KEYS.USERS, users);
            
            // 初始化好友列表
            const friends = getLocalStorage(STORAGE_KEYS.FRIENDS);
            friends[newUser.id] = [];
            setLocalStorage(STORAGE_KEYS.FRIENDS, friends);
            
            return newUser;
        
        case '/api/login':
            const loginUsers = getLocalStorage(STORAGE_KEYS.USERS);
            const user = loginUsers.find(u => u.username === data.username && u.password === data.password);
            if (user) {
                user.online = true;
                setLocalStorage(STORAGE_KEYS.USERS, loginUsers);
                return user;
            } else {
                return { error: '用户名或密码错误' };
            }
        
        case '/api/friends':
            if (method === 'GET') {
                const userId = new URLSearchParams(endpoint.split('?')[1]).get('userId');
                const friends = getLocalStorage(STORAGE_KEYS.FRIENDS);
                return friends[userId] || [];
            } else if (method === 'POST') {
                const friends = getLocalStorage(STORAGE_KEYS.FRIENDS);
                if (!friends[data.userId]) friends[data.userId] = [];
                if (!friends[data.friendId]) friends[data.friendId] = [];
                if (!friends[data.userId].includes(data.friendId)) friends[data.userId].push(data.friendId);
                if (!friends[data.friendId].includes(data.userId)) friends[data.friendId].push(data.userId);
                setLocalStorage(STORAGE_KEYS.FRIENDS, friends);
                return { success: true };
            }
            break;
        
        case '/api/deleteFriend':
            const deleteFriends = getLocalStorage(STORAGE_KEYS.FRIENDS);
            if (deleteFriends[data.userId]) {
                deleteFriends[data.userId] = deleteFriends[data.userId].filter(id => id !== data.friendId);
            }
            if (deleteFriends[data.friendId]) {
                deleteFriends[data.friendId] = deleteFriends[data.friendId].filter(id => id !== data.userId);
            }
            setLocalStorage(STORAGE_KEYS.FRIENDS, deleteFriends);
            return { success: true };
        
        case '/api/friendRequests':
            if (method === 'GET') {
                const userId = new URLSearchParams(endpoint.split('?')[1]).get('userId');
                const friendRequests = getLocalStorage(STORAGE_KEYS.FRIEND_REQUESTS);
                return friendRequests[userId] || [];
            } else if (method === 'POST') {
                const friendRequests = getLocalStorage(STORAGE_KEYS.FRIEND_REQUESTS);
                if (!friendRequests[data.toUserId]) friendRequests[data.toUserId] = [];
                if (!friendRequests[data.toUserId].includes(data.fromUserId)) {
                    friendRequests[data.toUserId].push(data.fromUserId);
                }
                setLocalStorage(STORAGE_KEYS.FRIEND_REQUESTS, friendRequests);
                return { success: true };
            }
            break;
        
        case '/api/acceptFriend':
            const acceptFriends = getLocalStorage(STORAGE_KEYS.FRIENDS);
            if (!acceptFriends[data.userId]) acceptFriends[data.userId] = [];
            if (!acceptFriends[data.friendId]) acceptFriends[data.friendId] = [];
            if (!acceptFriends[data.userId].includes(data.friendId)) acceptFriends[data.userId].push(data.friendId);
            if (!acceptFriends[data.friendId].includes(data.userId)) acceptFriends[data.friendId].push(data.userId);
            
            const acceptRequests = getLocalStorage(STORAGE_KEYS.FRIEND_REQUESTS);
            acceptRequests[data.userId] = acceptRequests[data.userId].filter(id => id !== data.friendId);
            
            setLocalStorage(STORAGE_KEYS.FRIENDS, acceptFriends);
            setLocalStorage(STORAGE_KEYS.FRIEND_REQUESTS, acceptRequests);
            return { success: true };
        
        case '/api/rejectFriend':
            const rejectRequests = getLocalStorage(STORAGE_KEYS.FRIEND_REQUESTS);
            if (rejectRequests[data.userId]) {
                rejectRequests[data.userId] = rejectRequests[data.userId].filter(id => id !== data.fromUserId);
            }
            setLocalStorage(STORAGE_KEYS.FRIEND_REQUESTS, rejectRequests);
            return { success: true };
        
        case '/api/posts':
            if (method === 'GET') {
                return getLocalStorage(STORAGE_KEYS.POSTS);
            } else if (method === 'POST') {
                const posts = getLocalStorage(STORAGE_KEYS.POSTS);
                data.id = Date.now().toString();
                data.timestamp = new Date().toISOString();
                data.likes = [];
                data.comments = [];
                posts.unshift(data);
                setLocalStorage(STORAGE_KEYS.POSTS, posts);
                return data;
            }
            break;
        
        case '/api/likePost':
            const likePosts = getLocalStorage(STORAGE_KEYS.POSTS);
            const likePost = likePosts.find(p => p.id === data.postId);
            if (likePost) {
                const idx = likePost.likes.indexOf(data.userId);
                if (idx > -1) {
                    likePost.likes.splice(idx, 1);
                } else {
                    likePost.likes.push(data.userId);
                }
                setLocalStorage(STORAGE_KEYS.POSTS, likePosts);
                return { success: true, likes: likePost.likes };
            } else {
                return { error: 'Post not found' };
            }
        
        case '/api/commentPost':
            const commentPosts = getLocalStorage(STORAGE_KEYS.POSTS);
            const commentPost = commentPosts.find(p => p.id === data.postId);
            if (commentPost) {
                const comment = {
                    id: Date.now().toString(),
                    userId: data.userId,
                    username: data.username,
                    content: data.content,
                    timestamp: new Date().toISOString()
                };
                commentPost.comments.push(comment);
                setLocalStorage(STORAGE_KEYS.POSTS, commentPosts);
                return { success: true, comments: commentPost.comments };
            } else {
                return { error: 'Post not found' };
            }
        
        case '/api/deletePost':
            const deletePosts = getLocalStorage(STORAGE_KEYS.POSTS);
            const index = deletePosts.findIndex(p => p.id === data.postId);
            if (index > -1) {
                deletePosts.splice(index, 1);
                setLocalStorage(STORAGE_KEYS.POSTS, deletePosts);
                return { success: true };
            } else {
                return { error: 'Post not found' };
            }
        
        case '/api/messages':
            if (method === 'GET') {
                const params = new URLSearchParams(endpoint.split('?')[1]);
                const userId = params.get('userId');
                const friendId = params.get('friendId');
                const chatId = userId < friendId ? `${userId}_${friendId}` : `${friendId}_${userId}`;
                const messages = getLocalStorage(STORAGE_KEYS.MESSAGES);
                return messages[chatId] || [];
            } else if (method === 'POST') {
                const messages = getLocalStorage(STORAGE_KEYS.MESSAGES);
                const chatId = data.senderId < data.receiverId ? `${data.senderId}_${data.receiverId}` : `${data.receiverId}_${data.senderId}`;
                if (!messages[chatId]) messages[chatId] = [];
                const message = {
                    id: Date.now().toString(),
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                    text: data.text,
                    timestamp: new Date().toISOString()
                };
                messages[chatId].push(message);
                setLocalStorage(STORAGE_KEYS.MESSAGES, messages);
                return message;
            }
            break;
        
        case '/api/updateUser':
            const updateUsers = getLocalStorage(STORAGE_KEYS.USERS);
            const updateUser = updateUsers.find(u => u.id === data.userId);
            if (updateUser) {
                updateUser.online = data.online;
                setLocalStorage(STORAGE_KEYS.USERS, updateUsers);
                return { success: true };
            } else {
                return { error: 'User not found' };
            }
        
        default:
            return { error: 'Endpoint not found' };
    }
}

const api = {
    getUsers: () => apiCall('/api/users'),

    register: (username, password) => apiCall('/api/register', 'POST', { username, password }),

    login: (username, password) => apiCall('/api/login', 'POST', { username, password }),

    getFriends: (userId) => apiCall(`/api/friends?userId=${userId}`),

    addFriend: (userId, friendId) => apiCall('/api/friends', 'POST', { userId, friendId }),

    deleteFriend: (userId, friendId) => apiCall('/api/deleteFriend', 'POST', { userId, friendId }),

    getFriendRequests: (userId) => apiCall(`/api/friendRequests?userId=${userId}`),

    sendFriendRequest: (toUserId, fromUserId) => apiCall('/api/friendRequests', 'POST', { toUserId, fromUserId }),

    acceptFriend: (userId, friendId) => apiCall('/api/acceptFriend', 'POST', { userId, friendId }),

    rejectFriend: (userId, fromUserId) => apiCall('/api/rejectFriend', 'POST', { userId, fromUserId }),

    getPosts: () => apiCall('/api/posts'),

    createPost: (post) => apiCall('/api/posts', 'POST', post),

    likePost: (postId, userId) => apiCall('/api/likePost', 'POST', { postId, userId }),

    commentPost: (postId, userId, username, content) => apiCall('/api/commentPost', 'POST', { postId, userId, username, content }),

    deletePost: (postId) => apiCall('/api/deletePost', 'POST', { postId }),

    getMessages: (userId, friendId) => apiCall(`/api/messages?userId=${userId}&friendId=${friendId}`),

    sendMessage: (senderId, receiverId, text) => apiCall('/api/messages', 'POST', { senderId, receiverId, text }),

    updateUserStatus: (userId, online) => apiCall('/api/updateUser', 'POST', { userId, online })
};

window.api = api;
