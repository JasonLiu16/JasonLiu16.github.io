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

let users = [];
let friends = [];
let friendRequests = [];
let posts = [];
let currentUserId = null;
let currentUsername = null;
let selectedUserId = null;
let messages = [];

init();

function init() {
    if (currentUserId) {
        showChatInterface();
    } else {
        showAuthInterface();
    }
    bindEvents();
    loadInitialData();
    setInterval(loadInitialData, 2000);
}

async function loadInitialData() {
    if (!currentUserId) return;
    try {
        users = await api.getUsers();
        friends = await api.getFriends(currentUserId);
        friendRequests = await api.getFriendRequests(currentUserId);
        posts = await api.getPosts();
        if (personalSection.style.display === 'block') {
            updatePersonalInfo();
            loadMyPosts();
        }
        if (friendsSection.style.display === 'block') {
            loadFriendList();
        }
        if (chatListSection.style.display === 'block') {
            loadChatList();
        }
        if (squareSection.style.display === 'block') {
            loadSquarePosts();
        }
        if (selectedUserId) {
            loadMessages();
        }
    } catch (e) {
        console.error('Failed to load data:', e);
    }
}

function bindEvents() {
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

    loginButton.addEventListener('click', login);
    registerButton.addEventListener('click', register);
    logoutButton.addEventListener('click', logout);
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    personalTab.addEventListener('click', () => switchSection('personal'));
    friendsTab.addEventListener('click', () => switchSection('friends'));
    chatTab.addEventListener('click', () => switchSection('chat'));
    squareTab.addEventListener('click', () => switchSection('square'));
    addFriendButton.addEventListener('click', addFriend);
    postButton.addEventListener('click', publishPost);
    squareFilter.addEventListener('change', loadSquarePosts);
}

function switchSection(section) {
    personalTab.classList.remove('active');
    friendsTab.classList.remove('active');
    chatTab.classList.remove('active');
    squareTab.classList.remove('active');

    personalSection.style.display = 'none';
    friendsSection.style.display = 'none';
    chatListSection.style.display = 'none';
    squareSection.style.display = 'none';
    chatMessages.style.display = 'block';
    document.querySelector('.chat-input-container').style.display = 'flex';

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

function updatePersonalInfo() {
    const user = users.find(u => u.id === currentUserId);
    if (user) {
        personalUsername.textContent = user.username;
        personalId.textContent = user.id;
    }
}

function showAuthInterface() {
    authContainer.style.display = 'flex';
    chatContainer.style.display = 'none';
}

function showChatInterface() {
    authContainer.style.display = 'none';
    chatContainer.style.display = 'flex';
    const user = users.find(u => u.id === currentUserId);
    if (user) {
        currentUser.textContent = user.username;
    }
    switchSection('personal');
}

async function register() {
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

    try {
        const result = await api.register(username, password);
        if (result.error) {
            alert(result.error);
            return;
        }
        currentUserId = result.id;
        currentUsername = result.username;
        localStorage.setItem('currentUserId', currentUserId);
        localStorage.setItem('currentUsername', currentUsername);
        showChatInterface();
    } catch (e) {
        alert('注册失败');
    }
}

async function login() {
    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    if (!username || !password) {
        alert('请输入用户名和密码');
        return;
    }

    try {
        const result = await api.login(username, password);
        if (result.error) {
            alert(result.error);
            return;
        }
        currentUserId = result.id;
        currentUsername = result.username;
        localStorage.setItem('currentUserId', currentUserId);
        localStorage.setItem('currentUsername', currentUsername);
        showChatInterface();
    } catch (e) {
        alert('登录失败');
    }
}

async function logout() {
    if (currentUserId) {
        await api.updateUserStatus(currentUserId, false);
    }
    currentUserId = null;
    currentUsername = null;
    selectedUserId = null;
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUsername');
    showAuthInterface();
}

async function addFriend() {
    const friendId = friendIdInput.value.trim();
    if (!friendId) {
        alert('请输入好友ID');
        return;
    }

    const friend = users.find(u => u.id === friendId);
    if (!friend) {
        alert('好友ID不存在');
        return;
    }

    if (friends.includes(friendId)) {
        alert('已经是好友了');
        return;
    }

    if (friendRequests.includes(friendId)) {
        alert('好友请求已发送');
        return;
    }

    try {
        await api.sendFriendRequest(friendId, currentUserId);
        alert('好友请求已发送');
        friendIdInput.value = '';
    } catch (e) {
        alert('发送失败');
    }
}

async function loadFriendList() {
    friendList.innerHTML = '';
    friends = await api.getFriends(currentUserId);
    friendRequests = await api.getFriendRequests(currentUserId);

    if (friendRequests.length > 0) {
        const requestHeader = document.createElement('li');
        requestHeader.classList.add('friend-section-header');
        requestHeader.textContent = '好友请求';
        friendList.appendChild(requestHeader);

        for (const senderId of friendRequests) {
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
                acceptButton.addEventListener('click', () => acceptFriendRequest(senderId));

                const rejectButton = document.createElement('button');
                rejectButton.classList.add('reject-button');
                rejectButton.textContent = '拒绝';
                rejectButton.addEventListener('click', () => rejectFriendRequest(senderId));

                buttonContainer.appendChild(acceptButton);
                buttonContainer.appendChild(rejectButton);
                li.appendChild(requestInfo);
                li.appendChild(buttonContainer);
                friendList.appendChild(li);
            }
        }

        const friendsHeader = document.createElement('li');
        friendsHeader.classList.add('friend-section-header');
        friendsHeader.textContent = '我的好友';
        friendList.appendChild(friendsHeader);
    }

    for (const friendId of friends) {
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            const li = document.createElement('li');
            li.classList.add('friend-item');
            li.dataset.userId = friend.id;

            const friendInfo = document.createElement('div');
            friendInfo.textContent = friend.username;

            const actionDiv = document.createElement('div');
            actionDiv.classList.add('friend-actions');

            const statusDiv = document.createElement('div');
            statusDiv.classList.add('friend-status');
            statusDiv.classList.add(friend.online ? 'online' : 'offline');

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.textContent = '删除';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteFriend(friendId);
            });

            actionDiv.appendChild(statusDiv);
            actionDiv.appendChild(deleteButton);

            li.appendChild(friendInfo);
            li.appendChild(actionDiv);

            li.addEventListener('click', () => {
                document.querySelectorAll('.friend-item').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                selectedUserId = friend.id;
                switchSection('chat');
                loadMessages();
            });

            friendList.appendChild(li);
        }
    }
}

async function acceptFriendRequest(senderId) {
    await api.acceptFriend(currentUserId, senderId);
    loadFriendList();
    alert('已接受好友请求');
}

async function rejectFriendRequest(senderId) {
    await api.rejectFriend(currentUserId, senderId);
    loadFriendList();
    alert('已拒绝好友请求');
}

async function deleteFriend(friendId) {
    if (confirm('确定要删除这个好友吗？')) {
        await api.deleteFriend(currentUserId, friendId);
        if (selectedUserId === friendId) {
            selectedUserId = null;
            chatMessages.innerHTML = '';
        }
        loadFriendList();
        loadChatList();
        alert('好友已删除');
    }
}

async function loadChatList() {
    chatList.innerHTML = '';
    friends = await api.getFriends(currentUserId);

    for (const friendId of friends) {
        const friend = users.find(u => u.id === friendId);
        if (friend) {
            const li = document.createElement('li');
            li.classList.add('chat-item');
            li.dataset.userId = friend.id;

            const chatName = document.createElement('div');
            chatName.classList.add('chat-name');
            chatName.textContent = friend.username;

            const chatPreview = document.createElement('div');
            chatPreview.classList.add('chat-preview');
            chatPreview.textContent = '点击查看消息';

            li.appendChild(chatName);
            li.appendChild(chatPreview);

            li.addEventListener('click', () => {
                document.querySelectorAll('.chat-item').forEach(item => item.classList.remove('active'));
                li.classList.add('active');
                selectedUserId = friend.id;
                loadMessages();
            });

            chatList.appendChild(li);
        }
    }
}

async function loadMessages() {
    chatMessages.innerHTML = '';

    if (!selectedUserId) return;

    if (!friends.includes(selectedUserId)) {
        const errorDiv = document.createElement('div');
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginTop = '50px';
        errorDiv.style.color = '#666';
        errorDiv.textContent = '只有好友之间可以聊天';
        chatMessages.appendChild(errorDiv);
        return;
    }

    messages = await api.getMessages(currentUserId, selectedUserId);

    messages.forEach(msg => showMessage(msg.senderId, msg.text));
}

async function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !selectedUserId) return;

    if (!friends.includes(selectedUserId)) {
        alert('只有好友之间可以聊天');
        return;
    }

    await api.sendMessage(currentUserId, selectedUserId, text);
    showMessage(currentUserId, text);
    messageInput.value = '';
}

function showMessage(senderId, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(senderId === currentUserId ? 'user-message' : 'other-message');

    const sender = users.find(u => u.id === senderId);
    if (sender) {
        const senderDiv = document.createElement('div');
        senderDiv.classList.add('message-sender');
        senderDiv.textContent = sender.username;
        messageDiv.appendChild(senderDiv);
    }

    const textDiv = document.createElement('div');
    textDiv.textContent = text;
    messageDiv.appendChild(textDiv);

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function publishPost() {
    const content = postInput.value.trim();
    const imageFiles = imageInput.files;

    if (!content && imageFiles.length === 0) {
        alert('请输入内容或上传图片');
        return;
    }

    const post = {
        userId: currentUserId,
        username: currentUsername,
        content: content,
        type: postType.value,
        images: []
    };

    if (imageFiles.length > 0) {
        let loadedCount = 0;
        const totalCount = imageFiles.length;

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

async function savePost(post) {
    await api.createPost(post);
    postInput.value = '';
    postType.value = '专业课书籍';
    imageInput.value = '';
    loadMyPosts();
    alert('发布成功');
}

async function loadMyPosts() {
    myPostsList.innerHTML = '';
    posts = await api.getPosts();
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

    for (const post of myPosts) {
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
        viewButton.addEventListener('click', () => showPostDetails(post));

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-post-btn');
        deleteButton.textContent = '删除';
        deleteButton.addEventListener('click', () => deletePost(post.id));

        interactions.appendChild(likeInfo);
        interactions.appendChild(commentInfo);
        interactions.appendChild(viewButton);
        interactions.appendChild(deleteButton);

        postDiv.appendChild(header);
        postDiv.appendChild(content);
        postDiv.appendChild(interactions);

        myPostsList.appendChild(postDiv);
    }
}

async function loadSquarePosts() {
    squarePosts.innerHTML = '';
    posts = await api.getPosts();
    users = await api.getUsers();
    friends = await api.getFriends(currentUserId);

    const filterType = squareFilter.value;
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

    for (const post of filteredPosts) {
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

        if (post.userId !== currentUserId && !friends.includes(post.userId)) {
            const addFriendBtn = document.createElement('button');
            addFriendBtn.classList.add('add-friend-btn');
            addFriendBtn.textContent = '加好友';
            addFriendBtn.addEventListener('click', () => sendFriendRequestFromSquare(post.userId));
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

        if (post.images && post.images.length > 0) {
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('post-images-container');

            post.images.forEach((imageUrl, index) => {
                const image = document.createElement('img');
                image.classList.add('post-image');
                image.src = imageUrl;
                image.alt = 'Post image';
                image.style.cursor = 'pointer';
                image.addEventListener('click', () => showImageModal(post.images, index));
                imageContainer.appendChild(image);
            });

            postDiv.appendChild(imageContainer);
        }

        const actions = document.createElement('div');
        actions.classList.add('post-actions');

        const likeButton = document.createElement('button');
        likeButton.classList.add('like-button');
        likeButton.textContent = post.likes && post.likes.includes(currentUserId) ? '已点赞' : '点赞';
        likeButton.addEventListener('click', () => toggleLike(post.id));

        const likeCount = document.createElement('span');
        likeCount.textContent = post.likes ? post.likes.length : 0;
        likeButton.appendChild(likeCount);

        const commentButton = document.createElement('button');
        commentButton.classList.add('comment-button');
        commentButton.textContent = '评论';
        commentButton.addEventListener('click', () => showCommentInput(post.id));

        actions.appendChild(likeButton);
        actions.appendChild(commentButton);

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
        commentSubmit.addEventListener('click', () => addComment(post.id, commentInput.value));

        commentInputContainer.appendChild(commentInput);
        commentInputContainer.appendChild(commentSubmit);

        postDiv.appendChild(header);
        postDiv.appendChild(content);
        postDiv.appendChild(actions);
        postDiv.appendChild(commentsContainer);
        postDiv.appendChild(commentInputContainer);

        squarePosts.appendChild(postDiv);
    }
}

async function toggleLike(postId) {
    await api.likePost(postId, currentUserId);
    loadSquarePosts();
}

function showCommentInput(postId) {
    const commentInputContainer = document.getElementById(`comment-input-${postId}`);
    if (commentInputContainer) {
        commentInputContainer.style.display = commentInputContainer.style.display === 'none' ? 'flex' : 'none';
    }
}

async function addComment(postId, content) {
    content = content.trim();
    if (!content) return;
    await api.commentPost(postId, currentUserId, currentUsername, content);
    loadSquarePosts();
}

async function sendFriendRequestFromSquare(userId) {
    if (friends.includes(userId)) {
        alert('已经是好友了');
        return;
    }
    if (friendRequests.includes(userId)) {
        alert('好友请求已发送');
        return;
    }
    await api.sendFriendRequest(userId, currentUserId);
    alert('好友请求已发送');
    loadSquarePosts();
}

async function deletePost(postId) {
    if (confirm('确定要删除这个帖子吗？')) {
        await api.deletePost(postId);
        loadMyPosts();
        loadSquarePosts();
        alert('帖子已删除');
    }
}

function showPostDetails(post) {
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

    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');
    modalContent.style.backgroundColor = 'white';
    modalContent.style.borderRadius = '10px';
    modalContent.style.padding = '20px';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '600px';
    modalContent.style.maxHeight = '80%';
    modalContent.style.overflowY = 'auto';

    const postContent = document.createElement('div');
    postContent.classList.add('post-details');

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

    const content = document.createElement('div');
    content.classList.add('post-content');
    content.textContent = post.content;

    if (post.images && post.images.length > 0) {
        const imageContainer = document.createElement('div');
        imageContainer.classList.add('post-images-container');

        post.images.forEach((imageUrl, index) => {
            const image = document.createElement('img');
            image.classList.add('post-image');
            image.src = imageUrl;
            image.alt = 'Post image';
            image.style.cursor = 'pointer';
            image.addEventListener('click', () => showImageModal(post.images, index));
            imageContainer.appendChild(image);
        });

        postContent.appendChild(imageContainer);
    }

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

    const closeButton = document.createElement('button');
    closeButton.textContent = '关闭';
    closeButton.style.marginTop = '20px';
    closeButton.style.padding = '10px 20px';
    closeButton.style.backgroundColor = '#4CAF50';
    closeButton.style.color = 'white';
    closeButton.style.border = 'none';
    closeButton.style.borderRadius = '5px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => document.body.removeChild(modal));

    postContent.appendChild(header);
    postContent.appendChild(content);
    postContent.appendChild(likesSection);
    postContent.appendChild(commentsSection);
    postContent.appendChild(closeButton);

    modalContent.appendChild(postContent);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function showImageModal(images, initialIndex) {
    const modal = document.createElement('div');
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

    const modalContent = document.createElement('div');
    modalContent.style.position = 'relative';
    modalContent.style.width = '90%';
    modalContent.style.maxWidth = '90vw';
    modalContent.style.maxHeight = '90vh';

    const imageContainer = document.createElement('div');
    imageContainer.style.position = 'relative';
    imageContainer.style.width = '100%';
    imageContainer.style.height = '100%';

    let currentIndex = initialIndex;

    function showCurrentImage() {
        imageContainer.innerHTML = '';
        const image = document.createElement('img');
        image.src = images[currentIndex];
        image.alt = `Image ${currentIndex + 1}`;
        image.style.maxWidth = '100%';
        image.style.maxHeight = '80vh';
        image.style.objectFit = 'contain';
        imageContainer.appendChild(image);
        updateCounter();
    }

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
    closeButton.addEventListener('click', () => document.body.removeChild(modal));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    });

    showCurrentImage();
    modalContent.appendChild(imageContainer);
    modalContent.appendChild(counter);
    modalContent.appendChild(prevButton);
    modalContent.appendChild(nextButton);
    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}
