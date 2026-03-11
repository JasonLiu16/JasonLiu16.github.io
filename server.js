const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const users = [];
const friends = {};
const friendRequests = {};
const posts = [];
const messages = {};

const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
};

function sendJSON(res, data, statusCode = 200) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify(data));
}

function sendFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('Server Error');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
        res.writeHead(200, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        res.end();
        return;
    }

    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    if (pathname === '/api/users' && req.method === 'GET') {
        sendJSON(res, users);
        return;
    }

    if (pathname === '/api/register' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { username, password } = JSON.parse(body);
            if (users.some(u => u.username === username)) {
                sendJSON(res, { error: '用户名已存在' }, 400);
                return;
            }
            const newUser = {
                id: Date.now().toString(),
                username,
                password,
                online: true
            };
            users.push(newUser);
            friends[newUser.id] = [];
            sendJSON(res, newUser);
        });
        return;
    }

    if (pathname === '/api/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { username, password } = JSON.parse(body);
            const user = users.find(u => u.username === username && u.password === password);
            if (user) {
                user.online = true;
                sendJSON(res, user);
            } else {
                sendJSON(res, { error: '用户名或密码错误' }, 401);
            }
        });
        return;
    }

    if (pathname === '/api/friends' && req.method === 'GET') {
        const userId = url.searchParams.get('userId');
        sendJSON(res, friends[userId] || []);
        return;
    }

    if (pathname === '/api/friends' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { userId, friendId } = JSON.parse(body);
            if (!friends[userId]) friends[userId] = [];
            if (!friends[friendId]) friends[friendId] = [];
            if (!friends[userId].includes(friendId)) friends[userId].push(friendId);
            if (!friends[friendId].includes(userId)) friends[friendId].push(userId);
            sendJSON(res, { success: true });
        });
        return;
    }

    if (pathname === '/api/friendRequests' && req.method === 'GET') {
        const userId = url.searchParams.get('userId');
        sendJSON(res, friendRequests[userId] || []);
        return;
    }

    if (pathname === '/api/friendRequests' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { toUserId, fromUserId } = JSON.parse(body);
            if (!friendRequests[toUserId]) friendRequests[toUserId] = [];
            if (!friendRequests[toUserId].includes(fromUserId)) {
                friendRequests[toUserId].push(fromUserId);
            }
            sendJSON(res, { success: true });
        });
        return;
    }

    if (pathname === '/api/acceptFriend' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { userId, friendId } = JSON.parse(body);
            if (!friends[userId]) friends[userId] = [];
            if (!friends[friendId]) friends[friendId] = [];
            if (!friends[userId].includes(friendId)) friends[userId].push(friendId);
            if (!friends[friendId].includes(userId)) friends[friendId].push(userId);
            friendRequests[userId] = friendRequests[userId].filter(id => id !== friendId);
            sendJSON(res, { success: true });
        });
        return;
    }

    if (pathname === '/api/posts' && req.method === 'GET') {
        sendJSON(res, posts);
        return;
    }

    if (pathname === '/api/posts' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const post = JSON.parse(body);
            post.id = Date.now().toString();
            post.timestamp = new Date().toISOString();
            post.likes = [];
            post.comments = [];
            posts.unshift(post);
            sendJSON(res, post);
        });
        return;
    }

    if (pathname === '/api/likePost' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { postId, userId } = JSON.parse(body);
            const post = posts.find(p => p.id === postId);
            if (post) {
                const idx = post.likes.indexOf(userId);
                if (idx > -1) {
                    post.likes.splice(idx, 1);
                } else {
                    post.likes.push(userId);
                }
                sendJSON(res, { success: true, likes: post.likes });
            } else {
                sendJSON(res, { error: 'Post not found' }, 404);
            }
        });
        return;
    }

    if (pathname === '/api/commentPost' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { postId, userId, username, content } = JSON.parse(body);
            const post = posts.find(p => p.id === postId);
            if (post) {
                const comment = {
                    id: Date.now().toString(),
                    userId,
                    username,
                    content,
                    timestamp: new Date().toISOString()
                };
                post.comments.push(comment);
                sendJSON(res, { success: true, comments: post.comments });
            } else {
                sendJSON(res, { error: 'Post not found' }, 404);
            }
        });
        return;
    }

    if (pathname === '/api/deletePost' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { postId } = JSON.parse(body);
            const index = posts.findIndex(p => p.id === postId);
            if (index > -1) {
                posts.splice(index, 1);
                sendJSON(res, { success: true });
            } else {
                sendJSON(res, { error: 'Post not found' }, 404);
            }
        });
        return;
    }

    if (pathname === '/api/messages' && req.method === 'GET') {
        const userId = url.searchParams.get('userId');
        const friendId = url.searchParams.get('friendId');
        const chatId = userId < friendId ? `${userId}_${friendId}` : `${friendId}_${userId}`;
        sendJSON(res, messages[chatId] || []);
        return;
    }

    if (pathname === '/api/messages' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { senderId, receiverId, text } = JSON.parse(body);
            const chatId = senderId < receiverId ? `${senderId}_${receiverId}` : `${receiverId}_${senderId}`;
            if (!messages[chatId]) messages[chatId] = [];
            const message = {
                id: Date.now().toString(),
                senderId,
                receiverId,
                text,
                timestamp: new Date().toISOString()
            };
            messages[chatId].push(message);
            sendJSON(res, message);
        });
        return;
    }

    if (pathname === '/api/deleteFriend' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { userId, friendId } = JSON.parse(body);
            if (friends[userId]) {
                friends[userId] = friends[userId].filter(id => id !== friendId);
            }
            if (friends[friendId]) {
                friends[friendId] = friends[friendId].filter(id => id !== userId);
            }
            sendJSON(res, { success: true });
        });
        return;
    }

    if (pathname === '/api/rejectFriend' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { userId, fromUserId } = JSON.parse(body);
            if (friendRequests[userId]) {
                friendRequests[userId] = friendRequests[userId].filter(id => id !== fromUserId);
            }
            sendJSON(res, { success: true });
        });
        return;
    }

    if (pathname === '/api/updateUser' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const { userId, online } = JSON.parse(body);
            const user = users.find(u => u.id === userId);
            if (user) {
                user.online = online;
                sendJSON(res, { success: true });
            } else {
                sendJSON(res, { error: 'User not found' }, 404);
            }
        });
        return;
    }

    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    sendFile(res, filePath);
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log(`Access from other devices using your local IP address`);
});
