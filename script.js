// DOM元素
const authContainer = document.getElementById('authContainer');
const chatContainer = document.getElementById('chatContainer');
const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginButton = document.getElementById('loginButton');
const registerButton = document.getElementById('registerButton');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const registerUsername = document.getElementById('registerUsername');
const registerPassword = document.getElementById('registerPassword');
const registerConfirmPassword = document.getElementById('registerConfirmPassword');
const currentUser = document.getElementById('currentUser');
const logoutButton = document.getElementById('logoutButton');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

// 新添加的DOM元素
const personalTab = document.getElementById('personalTab');
const friendsTab = document.getElementById('friendsTab');
const chatTab = document.getElementById('chatTab');
const squareTab = document.getElementById('squareTab');
const personalSection = document.getElementById('personalSection');
const friendsSection = document.getElementById('friendsSection');
const chatListSection = document.getElementById('chatListSection');
const squareSection = document.getElementById('squareSection');
const personalUsername = document.getElementById('personalUsername');
const personalId = document.getElementById('personalId');
const friendIdInput = document.getElementById('friendIdInput');
const addFriendButton = document.getElementById('addFriendButton');
const friendList = document.getElementById('friendList');
const chatList = document.getElementById('chatList');
const postInput = document.getElementById('postInput');
const postType = document.getElementById('postType');
const imageInput = document.getElementById('imageInput');
const postButton = document.getElementById('postButton');
const myPostsList = document.getElementById('myPostsList');
const squarePosts = document.getElementById('squarePosts');
const squareFilter = document.getElementById('squareFilter');

// 全局变量
let users = JSON.parse(localStorage.getItem('users')) || [];
let friends = JSON.parse(localStorage.getItem('friends')) || {};
let friendRequests = JSON.parse(localStorage.getItem('friendRequests')) || {};
let posts = JSON.parse(localStorage.getItem('posts')) || [];
let currentUserId = localStorage.getItem('currentUserId');
let selectedUserId = null;
let messages = JSON.parse(localStorage.getItem('messages')) || {};

// 确保所有用户都有online属性
users = users.map(user => ({
    ...user,
    online: user.online !== undefined ? user.online : false
}));
localStorage.setItem('users', JSON.stringify(users));

// 确保好友列表结构正确
if (!friends[currentUserId]) {
    friends[currentUserId] = [];
    localStorage.setItem('friends', JSON.stringify(friends));
}

// 确保好友请求结构正确
if (!friendRequests[currentUserId]) {
    friendRequests[currentUserId] = [];
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
}

// 初始化
init();

// 初始化函数
function init() {
    // 检查是否已登录
    if (currentUserId) {
        // 设置当前用户为在线状态
        const user = users.find(u => u.id === currentUserId);
        if (user) {
            user.online = true;
            localStorage.setItem('users', JSON.stringify(users));
        }
        showChatInterface();
    } else {
        showAuthInterface();
    }
    
    // 绑定事件
    bindEvents();
    
    // 监听localStorage变化，实现跨标签页同步
    window.addEventListener('storage', function(e) {
        if (e.key === 'users') {
            users = JSON.parse(e.newValue) || [];
            if (currentUserId) {
                loadFriendList();
                loadChatList();
            }
        } else if (e.key === 'messages') {
            messages = JSON.parse(e.newValue) || {};
            if (currentUserId && selectedUserId) {
                loadMessages();
            }
        } else if (e.key === 'friends') {
            friends = JSON.parse(e.newValue) || {};
            if (currentUserId) {
                loadFriendList();
                loadChatList();
            }
        } else if (e.key === 'friendRequests') {
            friendRequests = JSON.parse(e.newValue) || {};
            if (currentUserId) {
                loadFriendList();
            }
        } else if (e.key === 'posts') {
            posts = JSON.parse(e.newValue) || [];
            if (currentUserId) {
                // 重新加载我的帖子
                if (personalSection.style.display === 'block') {
                    loadMyPosts();
                }
                // 重新加载广场帖子
                if (squareSection.style.display === 'block') {
                    loadSquarePosts();
                }
            }
        }
    });
    
    // 定期检查新消息和用户列表
    setInterval(function() {
        if (currentUserId) {
            // 重新加载好友列表
            loadFriendList();
            
            // 重新加载聊天列表
            loadChatList();
            
            // 如果已选择用户，重新加载消息
            if (selectedUserId) {
                loadMessages();
            }
        }
    }, 2000);
}

// 绑定事件
function bindEvents() {
    // 认证标签切换
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });
    
    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });
    
    // 登录按钮
    loginButton.addEventListener('click', login);
    
    // 注册按钮
    registerButton.addEventListener('click', register);
    
    // 退出按钮
    logoutButton.addEventListener('click', logout);
    
    // 发送按钮
    sendButton.addEventListener('click', sendMessage);
    
    // 输入框回车
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 导航按钮
    personalTab.addEventListener('click', () => {
        switchSection('personal');
    });
    
    friendsTab.addEventListener('click', () => {
        switchSection('friends');
    });
    
    chatTab.addEventListener('click', () => {
        switchSection('chat');
    });
    
    squareTab.addEventListener('click', () => {
        switchSection('square');
    });
    
    // 添加好友按钮
    addFriendButton.addEventListener('click', addFriend);
    
    // 发布按钮
    postButton.addEventListener('click', publishPost);
    
    // 广场分类筛选
    squareFilter.addEventListener('change', loadSquarePosts);
}

// 切换板块
function switchSection(section) {
    // 移除所有导航按钮的active类
    personalTab.classList.remove('active');
    friendsTab.classList.remove('active');
    chatTab.classList.remove('active');
    squareTab.classList.remove('active');
    
    // 隐藏所有板块
    personalSection.style.display = 'none';
    friendsSection.style.display = 'none';
    chatListSection.style.display = 'none';
    squareSection.style.display = 'none';
    chatMessages.style.display = 'block';
    document.querySelector('.chat-input-container').style.display = 'flex';
    
    // 显示选中的板块
    if (section === 'personal') {
        personalTab.classList.add('active');
        personalSection.style.display = 'block';
        updatePersonalInfo();
        loadMyPosts();
    } else if (section === 'friends') {
        friendsTab.classList.add('active');
        friendsSection.style.display = 'block';
        loadFriendList();
    } else if (section === 'chat') {
        chatTab.classList.add('active');
        chatListSection.style.display = 'block';
        loadChatList();
    } else if (section === 'square') {
        squareTab.classList.add('active');
        squareSection.style.display = 'block';
        chatMessages.style.display = 'none';
        document.querySelector('.chat-input-container').style.display = 'none';
        loadSquarePosts();
    }
}

// 更新个人信息
function updatePersonalInfo() {
    const user = users.find(u => u.id === currentUserId);
    if (user) {
        personalUsername.textContent = user.username;
        personalId.textContent = user.id;
    }
}

// 显示认证界面
function showAuthInterface() {
    authContainer.style.display = 'flex';
    chatContainer.style.display = 'none';
}

// 显示聊天界面
function showChatInterface() {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    
    // 更新当前用户信息
    const user = users.find(u => u.id === currentUserId);
    if (user) {
        currentUser.textContent = user.username;
    }
    
    // 切换到个人板块
    switchSection('personal');
}

// 注册功能
function register() {
    const username = registerUsername.value.trim();
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }
    
    // 检查用户名是否已存在
    if (users.some(u => u.username === username)) {
        alert('用户名已存在');
        return;
    }
    
    // 创建新用户
    const newUser = {
        id: Date.now().toString(),
        username: username,
        password: password,
        online: true
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // 初始化好友列表
    if (!friends[newUser.id]) {
        friends[newUser.id] = [];
        localStorage.setItem('friends', JSON.stringify(friends));
    }
    
    // 自动登录
    currentUserId = newUser.id;
    localStorage.setItem('currentUserId', currentUserId);
    
    showChatInterface();
}

// 登录功能
function login() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;
    
    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }
    
    // 查找用户
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        alert('用户名或密码错误');
        return;
    }
    
    // 设置用户为在线状态
    user.online = true;
    localStorage.setItem('users', JSON.stringify(users));
    
    // 初始化好友列表
    if (!friends[user.id]) {
        friends[user.id] = [];
        localStorage.setItem('friends', JSON.stringify(friends));
    }
    
    // 登录成功
    currentUserId = user.id;
    localStorage.setItem('currentUserId', currentUserId);
    
    showChatInterface();
}

// 退出功能
function logout() {
    // 设置当前用户为离线状态
    if (currentUserId) {
        const user = users.find(u => u.id === currentUserId);
        if (user) {
            user.online = false;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
    
    currentUserId = null;
    selectedUserId = null;
    localStorage.removeItem('currentUserId');
    showAuthInterface();
}

// 添加好友
function addFriend() {
    const friendId = friendIdInput.value.trim();
    
    if (!friendId) {
        alert('请输入好友ID');
        return;
    }
    
    // 检查好友ID是否存在
    const friend = users.find(u => u.id === friendId);
    if (!friend) {
        alert('好友ID不存在');
        return;
    }
    
    // 检查是否已经是好友
    if (!friends[currentUserId]) {
        friends[currentUserId] = [];
    }
    
    if (friends[currentUserId].includes(friendId)) {
        alert('已经是好友了');
        return;
    }
    
    // 检查是否已经发送过好友请求
    if (!friendRequests[friendId]) {
        friendRequests[friendId] = [];
    }
    
    if (friendRequests[friendId].includes(currentUserId)) {
        alert('好友请求已发送');
        return;
    }
    
    // 发送好友请求
    friendRequests[friendId].push(currentUserId);
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    
    // 触发storage事件（模拟其他标签页的修改）
    const event = new Event('storage');
    event.key = 'friendRequests';
    event.newValue = JSON.stringify(friendRequests);
    window.dispatchEvent(event);
    
    // 通知用户
    alert('好友请求已发送');
    friendIdInput.value = '';
}

// 加载好友列表
function loadFriendList() {
    friendList.innerHTML = '';
    
    // 显示好友请求
    if (friendRequests[currentUserId] && friendRequests[currentUserId].length > 0) {
        const requestHeader = document.createElement('li');
        requestHeader.classList.add('friend-section-header');
        requestHeader.textContent = '好友请求';
        friendList.appendChild(requestHeader);
        
        friendRequests[currentUserId].forEach(senderId => {
            const sender = users.find(u => u.id === senderId);
            if (sender) {
                const li = document.createElement('li');
                li.classList.add('friend-request-item');
                
                const requestInfo = document.createElement('div');
                requestInfo.textContent = sender.username;
                
                const buttonContainer = document.createElement('div');
                buttonContainer.classList.add('request-buttons');
                
                const acceptButton = document.createElement('button');
                acceptButton.classList.add('accept-button');
                acceptButton.textContent = '接受';
                acceptButton.addEventListener('click', () => {
                    acceptFriendRequest(senderId);
                });
                
                const rejectButton = document.createElement('button');
                rejectButton.classList.add('reject-button');
                rejectButton.textContent = '拒绝';
                rejectButton.addEventListener('click', () => {
                    rejectFriendRequest(senderId);
                });
                
                buttonContainer.appendChild(acceptButton);
                buttonContainer.appendChild(rejectButton);
                
                li.appendChild(requestInfo);
                li.appendChild(buttonContainer);
                
                friendList.appendChild(li);
            }
        });
        
        const friendsHeader = document.createElement('li');
        friendsHeader.classList.add('friend-section-header');
        friendsHeader.textContent = '我的好友';
        friendList.appendChild(friendsHeader);
    }
    
    if (!friends[currentUserId]) {
        friends[currentUserId] = [];
        localStorage.setItem('friends', JSON.stringify(friends));
    }
    
    friends[currentUserId].forEach(friendId => {
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            const li = document.createElement('li');
            li.classList.add('friend-item');
            li.dataset.userId = friend.id;
            
            const friendInfo = document.createElement('div');
            friendInfo.textContent = friend.username;
            
            const statusDiv = document.createElement('div');
            statusDiv.classList.add('friend-status');
            statusDiv.classList.add(friend.online ? 'online' : 'offline');
            
            const actionDiv = document.createElement('div');
            actionDiv.classList.add('friend-actions');
            
            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.textContent = '删除';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止触发点击好友的事件
                deleteFriend(friendId);
            });
            
            actionDiv.appendChild(statusDiv);
            actionDiv.appendChild(deleteButton);
            
            li.appendChild(friendInfo);
            li.appendChild(actionDiv);
            
            li.addEventListener('click', () => {
                // 移除其他好友的active类
                document.querySelectorAll('.friend-item').forEach(item => {
                    item.classList.remove('active');
                });
                // 添加当前好友的active类
                li.classList.add('active');
                // 选择用户
                selectedUserId = friend.id;
                // 切换到聊天板块
                switchSection('chat');
                // 加载消息
                loadMessages();
            });
            
            friendList.appendChild(li);
        }
    });
}

// 接受好友请求
function acceptFriendRequest(senderId) {
    // 确保双方都有好友列表
    if (!friends[currentUserId]) {
        friends[currentUserId] = [];
    }
    if (!friends[senderId]) {
        friends[senderId] = [];
    }
    
    // 添加到双方好友列表
    if (!friends[currentUserId].includes(senderId)) {
        friends[currentUserId].push(senderId);
    }
    if (!friends[senderId].includes(currentUserId)) {
        friends[senderId].push(currentUserId);
    }
    
    // 保存好友列表
    localStorage.setItem('friends', JSON.stringify(friends));
    
    // 触发friends的storage事件
    const friendsEvent = new Event('storage');
    friendsEvent.key = 'friends';
    friendsEvent.newValue = JSON.stringify(friends);
    window.dispatchEvent(friendsEvent);
    
    // 从好友请求中移除
    friendRequests[currentUserId] = friendRequests[currentUserId].filter(id => id !== senderId);
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    
    // 触发friendRequests的storage事件
    const requestsEvent = new Event('storage');
    requestsEvent.key = 'friendRequests';
    requestsEvent.newValue = JSON.stringify(friendRequests);
    window.dispatchEvent(requestsEvent);
    
    // 重新加载好友列表
    loadFriendList();
    
    // 通知用户
    alert('已接受好友请求');
}

// 拒绝好友请求
function rejectFriendRequest(senderId) {
    // 从好友请求中移除
    friendRequests[currentUserId] = friendRequests[currentUserId].filter(id => id !== senderId);
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    
    // 触发friendRequests的storage事件
    const event = new Event('storage');
    event.key = 'friendRequests';
    event.newValue = JSON.stringify(friendRequests);
    window.dispatchEvent(event);
    
    // 重新加载好友列表
    loadFriendList();
    
    // 通知用户
    alert('已拒绝好友请求');
}

// 删除好友
function deleteFriend(friendId) {
    if (confirm('确定要删除这个好友吗？')) {
        // 从当前用户的好友列表中移除
        if (friends[currentUserId]) {
            friends[currentUserId] = friends[currentUserId].filter(id => id !== friendId);
        }
        
        // 从对方的好友列表中移除
        if (friends[friendId]) {
            friends[friendId] = friends[friendId].filter(id => id !== currentUserId);
        }
        
        // 保存更新后的好友列表
        localStorage.setItem('friends', JSON.stringify(friends));
        
        // 触发friends的storage事件
        const event = new Event('storage');
        event.key = 'friends';
        event.newValue = JSON.stringify(friends);
        window.dispatchEvent(event);
        
        // 重新加载好友列表
        loadFriendList();
        
        // 重新加载聊天列表
        loadChatList();
        
        // 如果当前正在与该好友聊天，清空选中状态
        if (selectedUserId === friendId) {
            selectedUserId = null;
            chatMessages.innerHTML = '';
        }
        
        // 通知用户
        alert('好友已删除');
    }
}

// 发布帖子
function publishPost() {
    const content = postInput.value.trim();
    const imageFiles = imageInput.files;
    
    if (!content && imageFiles.length === 0) {
        alert('请输入内容或上传图片');
        return;
    }
    
    const user = users.find(u => u.id === currentUserId);
    if (!user) return;
    
    const post = {
        id: Date.now().toString(),
        userId: currentUserId,
        username: user.username,
        content: content,
        type: postType.value,
        images: [],
        timestamp: new Date().toISOString(),
        likes: [],
        comments: []
    };
    
    if (imageFiles.length > 0) {
        let loadedCount = 0;
        let totalCount = imageFiles.length;
        
        for (let i = 0; i < imageFiles.length; i++) {
            const reader = new FileReader();
            reader.onload = function(e) {
                post.images.push(e.target.result);
                loadedCount++;
                if (loadedCount === totalCount) {
                    savePost(post);
                }
            };
            reader.onerror = function() {
                alert('图片上传失败');
            };
            reader.readAsDataURL(imageFiles[i]);
        }
    } else {
        savePost(post);
    }
}

// 保存帖子
function savePost(post) {
    posts.unshift(post);
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // 触发posts的storage事件
    const event = new Event('storage');
    event.key = 'posts';
    event.newValue = JSON.stringify(posts);
    window.dispatchEvent(event);
    
    // 清空输入框
    postInput.value = '';
    postType.value = '专业课书籍';
    imageInput.value = '';
    
    // 重新加载我的帖子
    loadMyPosts();
    
    // 通知用户
    alert('发布成功');
}

// 加载我的帖子
function loadMyPosts() {
    myPostsList.innerHTML = '';
    
    const myPosts = posts.filter(post => post.userId === currentUserId);
    
    if (myPosts.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.color = '#666';
        emptyDiv.style.padding = '20px';
        emptyDiv.textContent = '还没有发布内容';
        myPostsList.appendChild(emptyDiv);
        return;
    }
    
    myPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-item');
        
        const header = document.createElement('div');
        header.classList.add('post-header');
        
        const userInfo = document.createElement('div');
        userInfo.style.display = 'flex';
        userInfo.style.alignItems = 'center';
        userInfo.style.gap = '10px';
        
        const username = document.createElement('span');
        username.classList.add('post-username');
        username.textContent = post.username;
        
        const postTypeBadge = document.createElement('span');
        postTypeBadge.classList.add('post-type-badge');
        postTypeBadge.textContent = post.type;
        
        const time = document.createElement('span');
        time.classList.add('post-time');
        time.textContent = new Date(post.timestamp).toLocaleString();
        
        userInfo.appendChild(username);
        userInfo.appendChild(postTypeBadge);
        header.appendChild(userInfo);
        header.appendChild(time);
        
        const content = document.createElement('div');
        content.classList.add('post-content');
        content.textContent = post.content;
        
        // 显示互动信息
        const interactions = document.createElement('div');
        interactions.classList.add('post-interactions');
        
        const likeInfo = document.createElement('div');
        likeInfo.classList.add('interaction-info');
        likeInfo.textContent = `点赞: ${post.likes ? post.likes.length : 0}`;
        
        const commentInfo = document.createElement('div');
        commentInfo.classList.add('interaction-info');
        commentInfo.textContent = `评论: ${post.comments ? post.comments.length : 0}`;
        
        const viewButton = document.createElement('button');
        viewButton.classList.add('view-details-btn');
        viewButton.textContent = '查看详情';
        viewButton.addEventListener('click', () => {
            showPostDetails(post);
        });
        
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-post-btn');
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', () => {
            deletePost(post.id);
        });
        
        interactions.appendChild(likeInfo);
        interactions.appendChild(commentInfo);
        interactions.appendChild(viewButton);
        interactions.appendChild(deleteButton);
        
        postDiv.appendChild(header);
        postDiv.appendChild(content);
        
        // 显示多张图片
        if (post.images && post.images.length > 0) {
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('post-images-container');
            
            post.images.forEach((imageUrl, index) => {
                const image = document.createElement('img');
                image.classList.add('post-image');
                image.src = imageUrl;
                image.alt = 'Post image';
                image.style.cursor = 'pointer';
                image.addEventListener('click', () => {
                    showImageModal(post.images, index);
                });
                imageContainer.appendChild(image);
            });
            
            postDiv.appendChild(imageContainer);
        }
        
        postDiv.appendChild(interactions);
        
        myPostsList.appendChild(postDiv);
    });
}

// 加载广场帖子
function loadSquarePosts() {
    squarePosts.innerHTML = '';
    
    // 获取筛选类型
    const filterType = squareFilter.value;
    
    // 筛选帖子
    const filteredPosts = filterType === 'all' ? posts : posts.filter(post => post.type === filterType);
    
    if (filteredPosts.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.color = '#666';
        emptyDiv.style.padding = '50px';
        emptyDiv.textContent = filterType === 'all' ? '广场还没有内容，快来发布第一条吧！' : '该分类下还没有内容';
        squarePosts.appendChild(emptyDiv);
        return;
    }
    
    filteredPosts.forEach(post => {
        const postDiv = document.createElement('div');
        postDiv.classList.add('post-item');
        
        const header = document.createElement('div');
        header.classList.add('post-header');
        
        const userInfo = document.createElement('div');
        userInfo.style.display = 'flex';
        userInfo.style.alignItems = 'center';
        userInfo.style.gap = '10px';
        
        const username = document.createElement('span');
        username.classList.add('post-username');
        username.textContent = post.username;
        
        const postTypeBadge = document.createElement('span');
        postTypeBadge.classList.add('post-type-badge');
        postTypeBadge.textContent = post.type;
        
        // 添加好友按钮（如果不是自己且不是好友）
        if (post.userId !== currentUserId && (!friends[currentUserId] || !friends[currentUserId].includes(post.userId))) {
            const addFriendBtn = document.createElement('button');
            addFriendBtn.classList.add('add-friend-btn');
            addFriendBtn.textContent = '加好友';
            addFriendBtn.addEventListener('click', () => {
                sendFriendRequestFromSquare(post.userId);
            });
            userInfo.appendChild(addFriendBtn);
        }
        
        const time = document.createElement('span');
        time.classList.add('post-time');
        time.textContent = new Date(post.timestamp).toLocaleString();
        
        userInfo.appendChild(username);
        userInfo.appendChild(postTypeBadge);
        header.appendChild(userInfo);
        header.appendChild(time);
        
        const content = document.createElement('div');
        content.classList.add('post-content');
        content.textContent = post.content;
        
        const actions = document.createElement('div');
        actions.classList.add('post-actions');
        
        const likeButton = document.createElement('button');
        likeButton.classList.add('like-button');
        likeButton.textContent = post.likes.includes(currentUserId) ? '已点赞' : '点赞';
        likeButton.addEventListener('click', () => {
            toggleLike(post.id);
        });
        
        const likeCount = document.createElement('span');
        likeCount.textContent = post.likes.length;
        
        likeButton.appendChild(likeCount);
        
        const commentButton = document.createElement('button');
        commentButton.classList.add('comment-button');
        commentButton.textContent = '评论';
        commentButton.addEventListener('click', () => {
            showCommentInput(post.id);
        });
        
        actions.appendChild(likeButton);
        actions.appendChild(commentButton);
        
        // 评论列表
        const commentsContainer = document.createElement('div');
        commentsContainer.classList.add('comments-container');
        
        if (post.comments && post.comments.length > 0) {
            post.comments.forEach(comment => {
                const commentDiv = document.createElement('div');
                commentDiv.classList.add('comment-item');
                
                const commentHeader = document.createElement('div');
                commentHeader.classList.add('comment-header');
                
                const commentUsername = document.createElement('span');
                commentUsername.classList.add('comment-username');
                commentUsername.textContent = comment.username;
                
                const commentTime = document.createElement('span');
                commentTime.classList.add('comment-time');
                commentTime.textContent = new Date(comment.timestamp).toLocaleString();
                
                commentHeader.appendChild(commentUsername);
                commentHeader.appendChild(commentTime);
                
                const commentContent = document.createElement('div');
                commentContent.classList.add('comment-content');
                commentContent.textContent = comment.content;
                
                commentDiv.appendChild(commentHeader);
                commentDiv.appendChild(commentContent);
                commentsContainer.appendChild(commentDiv);
            });
        }
        
        // 评论输入框
        const commentInputContainer = document.createElement('div');
        commentInputContainer.classList.add('comment-input-container');
        commentInputContainer.id = `comment-input-${post.id}`;
        commentInputContainer.style.display = 'none';
        
        const commentInput = document.createElement('input');
        commentInput.type = 'text';
        commentInput.placeholder = '写下你的评论...';
        commentInput.classList.add('comment-input');
        
        const commentSubmit = document.createElement('button');
        commentSubmit.textContent = '发送';
        commentSubmit.classList.add('comment-submit');
        commentSubmit.addEventListener('click', () => {
            addComment(post.id, commentInput.value);
        });
        
        commentInputContainer.appendChild(commentInput);
        commentInputContainer.appendChild(commentSubmit);
        
        postDiv.appendChild(header);
        postDiv.appendChild(content);
        
        // 显示多张图片
        if (post.images && post.images.length > 0) {
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('post-images-container');
            
            post.images.forEach((imageUrl, index) => {
                const image = document.createElement('img');
                image.classList.add('post-image');
                image.src = imageUrl;
                image.alt = 'Post image';
                image.style.cursor = 'pointer';
                image.addEventListener('click', () => {
                    showImageModal(post.images, index);
                });
                imageContainer.appendChild(image);
            });
            
            postDiv.appendChild(imageContainer);
        }
        
        postDiv.appendChild(actions);
        postDiv.appendChild(commentsContainer);
        postDiv.appendChild(commentInputContainer);
        
        squarePosts.appendChild(postDiv);
    });
}

// 切换点赞状态
function toggleLike(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const index = post.likes.indexOf(currentUserId);
    if (index > -1) {
        post.likes.splice(index, 1);
    } else {
        post.likes.push(currentUserId);
    }
    
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // 触发posts的storage事件
    const event = new Event('storage');
    event.key = 'posts';
    event.newValue = JSON.stringify(posts);
    window.dispatchEvent(event);
    
    // 重新加载广场帖子
    loadSquarePosts();
}

// 显示评论输入框
function showCommentInput(postId) {
    const commentInputContainer = document.getElementById(`comment-input-${postId}`);
    if (commentInputContainer) {
        commentInputContainer.style.display = commentInputContainer.style.display === 'none' ? 'flex' : 'none';
    }
}

// 添加评论
function addComment(postId, content) {
    content = content.trim();
    if (!content) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    const user = users.find(u => u.id === currentUserId);
    if (!user) return;
    
    const comment = {
        id: Date.now().toString(),
        userId: currentUserId,
        username: user.username,
        content: content,
        timestamp: new Date().toISOString()
    };
    
    if (!post.comments) {
        post.comments = [];
    }
    
    post.comments.push(comment);
    localStorage.setItem('posts', JSON.stringify(posts));
    
    // 触发posts的storage事件
    const event = new Event('storage');
    event.key = 'posts';
    event.newValue = JSON.stringify(posts);
    window.dispatchEvent(event);
    
    // 重新加载广场帖子
    loadSquarePosts();
}

// 从广场发送好友请求
function sendFriendRequestFromSquare(userId) {
    // 检查是否已经是好友
    if (friends[currentUserId] && friends[currentUserId].includes(userId)) {
        alert('已经是好友了');
        return;
    }
    
    // 检查是否已经发送过好友请求
    if (!friendRequests[userId]) {
        friendRequests[userId] = [];
    }
    
    if (friendRequests[userId].includes(currentUserId)) {
        alert('好友请求已发送');
        return;
    }
    
    // 发送好友请求
    friendRequests[userId].push(currentUserId);
    localStorage.setItem('friendRequests', JSON.stringify(friendRequests));
    
    // 触发friendRequests的storage事件
    const event = new Event('storage');
    event.key = 'friendRequests';
    event.newValue = JSON.stringify(friendRequests);
    window.dispatchEvent(event);
    
    // 通知用户
    alert('好友请求已发送');
    
    // 重新加载广场帖子
    loadSquarePosts();
}

// 删除帖子
function deletePost(postId) {
    if (confirm('确定要删除这个帖子吗？')) {
        // 从帖子列表中移除
        posts = posts.filter(post => post.id !== postId);
        localStorage.setItem('posts', JSON.stringify(posts));
        
        // 触发posts的storage事件
        const event = new Event('storage');
        event.key = 'posts';
        event.newValue = JSON.stringify(posts);
        window.dispatchEvent(event);
        
        // 重新加载我的帖子
        loadMyPosts();
        
        // 重新加载广场帖子
        loadSquarePosts();
        
        // 通知用户
        alert('帖子已删除');
    }
}

// 显示帖子详情
function showPostDetails(post) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '10px';
    modalContent.style.padding = '20px';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '600px';
    modalContent.style.maxHeight = '80%';
    modalContent.style.overflowY = 'auto';
    
    // 帖子内容
    const postContent = document.createElement('div');
    postContent.classList.add('post-details');
    
    // 帖子头部
    const header = document.createElement('div');
    header.classList.add('post-header');
    
    const username = document.createElement('span');
    username.classList.add('post-username');
    username.textContent = post.username;
    
    const time = document.createElement('span');
    time.classList.add('post-time');
    time.textContent = new Date(post.timestamp).toLocaleString();
    
    header.appendChild(username);
    header.appendChild(time);
    
    // 帖子内容
    const content = document.createElement('div');
    content.classList.add('post-content');
    content.textContent = post.content;
    
    // 显示多张图片
    if (post.images && post.images.length > 0) {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('post-images-container');
        
        post.images.forEach((imageUrl, index) => {
            const image = document.createElement('img');
            image.classList.add('post-image');
            image.src = imageUrl;
            image.alt = 'Post image';
            image.style.cursor = 'pointer';
            image.addEventListener('click', () => {
                showImageModal(post.images, index);
            });
            imageContainer.appendChild(image);
        });
        
        postContent.appendChild(imageContainer);
    }
    
    // 点赞信息
    const likesSection = document.createElement('div');
    likesSection.classList.add('post-section');
    
    const likesHeader = document.createElement('h4');
    likesHeader.textContent = '点赞列表';
    
    if (post.likes && post.likes.length > 0) {
        const likesList = document.createElement('ul');
        likesList.style.listStyle = 'none';
        
        post.likes.forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (user) {
                const li = document.createElement('li');
                li.style.padding = '5px 0';
                li.textContent = user.username;
                likesList.appendChild(li);
            }
        });
        
        likesSection.appendChild(likesHeader);
        likesSection.appendChild(likesList);
    } else {
        const noLikes = document.createElement('p');
        noLikes.style.color = '#666';
        noLikes.textContent = '暂无点赞';
        
        likesSection.appendChild(likesHeader);
        likesSection.appendChild(noLikes);
    }
    
    // 评论信息
    const commentsSection = document.createElement('div');
    commentsSection.classList.add('post-section');
    
    const commentsHeader = document.createElement('h4');
    commentsHeader.textContent = '评论列表';
    
    if (post.comments && post.comments.length > 0) {
        const commentsList = document.createElement('div');
        commentsList.classList.add('comments-container');
        
        post.comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.classList.add('comment-item');
            
            const commentHeader = document.createElement('div');
            commentHeader.classList.add('comment-header');
            
            const commentUsername = document.createElement('span');
            commentUsername.classList.add('comment-username');
            commentUsername.textContent = comment.username;
            
            const commentTime = document.createElement('span');
            commentTime.classList.add('comment-time');
            commentTime.textContent = new Date(comment.timestamp).toLocaleString();
            
            commentHeader.appendChild(commentUsername);
            commentHeader.appendChild(commentTime);
            
            const commentContent = document.createElement('div');
            commentContent.classList.add('comment-content');
            commentContent.textContent = comment.content;
            
            commentDiv.appendChild(commentHeader);
            commentDiv.appendChild(commentContent);
            commentsList.appendChild(commentDiv);
        });
        
        commentsSection.appendChild(commentsHeader);
        commentsSection.appendChild(commentsList);
    } else {
        const noComments = document.createElement('p');
        noComments.style.color = '#666';
        noComments.textContent = '暂无评论';
        
        commentsSection.appendChild(commentsHeader);
        commentsSection.appendChild(noComments);
    }
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.marginTop = '20px';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#4CAF50';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 组装内容
    postContent.appendChild(header);
    postContent.appendChild(content);
    postContent.appendChild(likesSection);
    postContent.appendChild(commentsSection);
    postContent.appendChild(closeButton);
    
    modalContent.appendChild(postContent);
    modal.appendChild(modalContent);
    
    // 添加到页面
    document.body.appendChild(modal);
}

// 显示图片模态框
function showImageModal(images, initialIndex) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '2000';
    
    // 创建模态框内容
    const modalContent = document.createElement('div');
    modalContent.style.position = 'relative';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '90vw';
    modalContent.style.maxHeight = '90vh';
    
    // 图片容器
    const imageContainer = document.createElement('div');
    imageContainer.style.position = 'relative';
    imageContainer.style.width = '100%';
    imageContainer.style.height = '100%';
    
    // 当前图片索引
    let currentIndex = initialIndex;
    
    // 显示当前图片
    function showCurrentImage() {
        imageContainer.innerHTML = '';
        
        const image = document.createElement('img');
        image.src = images[currentIndex];
        image.alt = `Image ${currentIndex + 1}`;
        image.style.maxWidth = '100%';
        image.style.maxHeight = '80vh';
        image.style.objectFit = 'contain';
        
        imageContainer.appendChild(image);
        
        // 更新图片计数器
        updateCounter();
    }
    
    // 图片计数器
    const counter = document.createElement('div');
    counter.style.position = 'absolute';
    counter.style.bottom = '20px';
    counter.style.left = '50%';
    counter.style.transform = 'translateX(-50%)';
    counter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    counter.style.color = 'white';
    counter.style.padding = '5px 15px';
    counter.style.borderRadius = '20px';
    counter.style.fontSize = '14px';
    
    function updateCounter() {
        counter.textContent = `${currentIndex + 1}/${images.length}`;
    }
    
    // 上一张按钮
    const prevButton = document.createElement('button');
    prevButton.textContent = '‹';
    prevButton.style.position = 'absolute';
    prevButton.style.left = '10px';
    prevButton.style.top = '50%';
    prevButton.style.transform = 'translateY(-50%)';
    prevButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    prevButton.style.color = 'white';
    prevButton.style.border = 'none';
    prevButton.style.borderRadius = '50%';
    prevButton.style.width = '40px';
    prevButton.style.height = '40px';
    prevButton.style.fontSize = '24px';
    prevButton.style.cursor = 'pointer';
    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showCurrentImage();
    });
    
    // 下一张按钮
    const nextButton = document.createElement('button');
    nextButton.textContent = '›';
    nextButton.style.position = 'absolute';
    nextButton.style.right = '10px';
    nextButton.style.top = '50%';
    nextButton.style.transform = 'translateY(-50%)';
    nextButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    nextButton.style.color = 'white';
    nextButton.style.border = 'none';
    nextButton.style.borderRadius = '50%';
    nextButton.style.width = '40px';
    nextButton.style.height = '40px';
    nextButton.style.fontSize = '24px';
    nextButton.style.cursor = 'pointer';
    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        showCurrentImage();
    });
    
    // 关闭按钮
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '50%';
    closeButton.style.width = '40px';
    closeButton.style.height = '40px';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // 点击模态框背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // 组装内容
    showCurrentImage();
    modalContent.appendChild(imageContainer);
    modalContent.appendChild(counter);
    modalContent.appendChild(prevButton);
    modalContent.appendChild(nextButton);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    
    // 添加到页面
    document.body.appendChild(modal);
}

// 加载聊天列表
function loadChatList() {
    chatList.innerHTML = '';
    
    if (!friends[currentUserId]) {
        friends[currentUserId] = [];
        localStorage.setItem('friends', JSON.stringify(friends));
    }
    
    friends[currentUserId].forEach(friendId => {
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            const li = document.createElement('li');
            li.classList.add('chat-item');
            li.dataset.userId = friend.id;
            
            const chatName = document.createElement('div');
            chatName.classList.add('chat-name');
            chatName.textContent = friend.username;
            
            // 获取最新消息
            const chatId = getChatId(currentUserId, friend.id);
            const chatMessagesList = messages[chatId] || [];
            const latestMessage = chatMessagesList[chatMessagesList.length - 1];
            
            const chatPreview = document.createElement('div');
            chatPreview.classList.add('chat-preview');
            if (latestMessage) {
                const sender = users.find(u => u.id === latestMessage.senderId);
                chatPreview.textContent = `${sender ? sender.username : '未知'}: ${latestMessage.text}`;
            } else {
                chatPreview.textContent = '暂无消息';
            }
            
            li.appendChild(chatName);
            li.appendChild(chatPreview);
            
            li.addEventListener('click', () => {
                // 移除其他聊天的active类
                document.querySelectorAll('.chat-item').forEach(item => {
                    item.classList.remove('active');
                });
                // 添加当前聊天的active类
                li.classList.add('active');
                // 选择用户
                selectedUserId = friend.id;
                // 加载消息
                loadMessages();
            });
            
            chatList.appendChild(li);
        }
    });
}

// 加载消息
function loadMessages() {
    chatMessages.innerHTML = '';
    
    if (!selectedUserId) return;
    
    // 检查是否是好友
    if (!friends[currentUserId] || !friends[currentUserId].includes(selectedUserId)) {
        const errorDiv = document.createElement('div');
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginTop = '50px';
        errorDiv.style.color = '#666';
        errorDiv.textContent = '只有好友之间可以聊天';
        chatMessages.appendChild(errorDiv);
        return;
    }
    
    // 获取聊天ID
    const chatId = getChatId(currentUserId, selectedUserId);
    const chatMessagesList = messages[chatId] || [];
    
    chatMessagesList.forEach(msg => {
        showMessage(msg.senderId, msg.text);
    });
}

// 发送消息
function sendMessage() {
    const text = messageInput.value.trim();
    
    if (!text || !selectedUserId) return;
    
    // 检查是否是好友
    if (!friends[currentUserId] || !friends[currentUserId].includes(selectedUserId)) {
        alert('只有好友之间可以聊天');
        return;
    }
    
    // 创建消息
    const message = {
        id: Date.now().toString(),
        senderId: currentUserId,
        text: text,
        timestamp: new Date().toISOString()
    };
    
    // 保存消息
    const chatId = getChatId(currentUserId, selectedUserId);
    if (!messages[chatId]) {
        messages[chatId] = [];
    }
    messages[chatId].push(message);
    localStorage.setItem('messages', JSON.stringify(messages));
    
    // 显示消息
    showMessage(currentUserId, text);
    
    // 清空输入框
    messageInput.value = '';
    
    // 触发storage事件（模拟其他标签页的修改）
    const event = new Event('storage');
    event.key = 'messages';
    event.newValue = JSON.stringify(messages);
    window.dispatchEvent(event);
}

// 显示消息
function showMessage(senderId, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    
    if (senderId === currentUserId) {
        messageDiv.classList.add('user-message');
    } else {
        messageDiv.classList.add('other-message');
    }
    
    // 添加发送者信息
    const sender = users.find(u => u.id === senderId);
    if (sender) {
        const senderDiv = document.createElement('div');
        senderDiv.classList.add('message-sender');
        senderDiv.textContent = sender.username;
        messageDiv.appendChild(senderDiv);
    }
    
    // 添加消息内容
    const textDiv = document.createElement('div');
    textDiv.textContent = text;
    messageDiv.appendChild(textDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // 滚动到底部
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 获取聊天ID（确保一致性）
function getChatId(userId1, userId2) {
    return userId1 < userId2 ? `${userId1}_${userId2}` : `${userId2}_${userId1}`;
}