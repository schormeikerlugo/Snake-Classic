const gameView = document.getElementById('game-view');
const mobileChatView = document.getElementById('mobile-chat-view');
const mobileRankingView = document.getElementById('mobile-ranking-view');

const mobileChatBtn = document.getElementById('mobile-chat-btn');
const mobileRankingBtn = document.getElementById('mobile-ranking-btn');
const backBtns = document.querySelectorAll('.mobile-view-back-btn');

const desktopChatColumn = document.getElementById('chat-column');
const desktopRankingColumn = document.getElementById('ranking-column');

const mobileChatContent = document.getElementById('mobile-chat-content');
const mobileRankingContent = document.getElementById('mobile-ranking-content');

const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const rankingContainer = document.getElementById('ranking-container');

function showMobileView(view) {
    gameView.classList.add('hidden');
    if (view === 'chat') {
        mobileChatContent.appendChild(chatMessages);
        mobileChatContent.appendChild(chatForm);
        mobileChatView.classList.add('active');
    } else if (view === 'ranking') {
        mobileRankingContent.appendChild(rankingContainer);
        mobileRankingView.classList.add('active');
    }
}

function hideMobileView(view) {
    gameView.classList.remove('hidden');
    if (view === 'chat') {
        desktopChatColumn.appendChild(chatMessages);
        desktopChatColumn.appendChild(chatForm);
        mobileChatView.classList.remove('active');
    } else if (view === 'ranking') {
        desktopRankingColumn.appendChild(rankingContainer);
        mobileRankingView.classList.remove('active');
    }
}

mobileChatBtn.addEventListener('click', () => {
    showMobileView('chat');
});

mobileRankingBtn.addEventListener('click', () => {
    showMobileView('ranking');
});

backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        hideMobileView(target);
    });
});
